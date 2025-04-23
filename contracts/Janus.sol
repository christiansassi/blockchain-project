// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./security/Pausable.sol";
import "./security/ReentrancyGuard.sol";
import "./access/Ownable.sol";

import "./structs/Order.sol";
import "./enums/OrderStatus.sol";
import "./events/Events.sol";

/**
 * @dev This escrow contract facilitates secure transactions between buyers and sellers.
 * Funds are held in contract until order expiration, with a 1% platform fee.
 * Buyers can request refunds before expiration, which are manually reviewed.
 */
contract Janus is Ownable, Pausable, ReentrancyGuard, Events {

    // Order storage structure
    /**
    *                seller                                       buyer
    *                  │                                            │
    *     ┌────────────┴────────────┐                               │
    *     ▼                         ▼                               ▼
    * sellerLastId       sellerOrders[seller][key]        buyerOrders[seller][key] 
    *                               │                               │
    *                               └───────────────┬───────────────┘
    *                                               │
    *                                key (hash of buyer, seller, id)
    *                                               │
    *                                               ▼
    *                                          Order struct
    **/
    mapping(address => uint256) private sellerLastId;

    mapping(address => mapping(bytes32 => Order)) private sellerOrders;
    mapping(address => bytes32[]) private sellerOrderIds;

    mapping(address => mapping(bytes32 => Order)) private buyerOrders;
    mapping(address => bytes32[]) private buyerOrderIds;

    uint8 private constant FEE = 1; // 1% platform fee
    uint32 private constant MAX_SELL_DELAY = 24 * 60 * 60; // 24 hours
    uint32 private constant WARRANTY = 30 * 24 * 60 * 60; // 30 days

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Pauses the contract. Can only be called by the owner.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses the contract. Can only be called by the owner.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Disabled function to prevent renouncing ownership. Always reverts.
     */
    function renounceOwnership() public view override onlyOwner {
        revert("Renouncing ownership is disabled");
    }

    /**
     * @dev Transfers contract ownership to a new address.
     * @param newOwner The address of the new owner.
     */
    function updateOwner(address newOwner) external onlyOwner {
        transferOwnership(newOwner);
    }

    /**
     * @dev Returns the current owner's address.
     * @return The address of the contract owner.
     */
    function getOwner() public view returns (address) {
        return owner();
    }

    /**
     * @dev Returns the fixed service fee.
     * @return The fee value as a uint8.
     */
    function getFee() public pure returns (uint8) {
        return FEE;
    }

    /**
     * @dev Returns the maximum delay allowed for selling.
     * @return The max sell delay in seconds.
     */
    function getMaxSellDelay() public pure returns (uint32) {
        return MAX_SELL_DELAY;
    }

    /**
     * @dev Returns the warranty duration.
     * @return The warranty duration in seconds.
     */
    function getWarranty() public pure returns (uint32) {
        return WARRANTY;
    }

    /**
     * @dev Generates a unique order key
     * @param buyer Buyer's address
     * @param seller Seller's address
     * @param id Order ID
     */
    function _genKey(address buyer, address seller, uint256 id) private pure returns (bytes32) {
        return keccak256(abi.encode(buyer, seller, id));
    }

    /**
     * @dev Creates a new order
     * @param buyer Buyer's address
     * @param seller Seller's address
     * @param price Order price in wei
     */
    function _createOrder(address buyer, address seller, uint256 price) private returns (uint256) {
        require(buyer != address(0), "Invalid buyer address");
        require(seller != address(0), "Invalid seller address");
        require(buyer != seller, "Buyer and seller match");
        require(price > 0, "Price must be positive");

        uint256 id = ++sellerLastId[seller];
        bytes32 key = _genKey(buyer, seller, id);

        require(sellerOrders[seller][key].status == OrderStatus.None, "Order already exists");
        require(buyerOrders[buyer][key].status == OrderStatus.None, "Order already exists");

        Order memory order = Order({
            buyer: buyer,
            seller: seller,
            id: id,
            price: price,
            creationDate: block.timestamp,
            status: OrderStatus.Paid
        });

        sellerOrders[seller][key] = order;
        sellerOrderIds[seller].push(key);

        buyerOrders[buyer][key] = order;
        buyerOrderIds[buyer].push(key);

        return id;
    }

    /**
     * @dev Validates order consistency between buyer/seller records
     * @param buyer Buyer's address
     * @param seller Seller's address
     * @param id Order ID
     */
    function _validateOrder(address buyer, address seller, uint256 id) private view returns (bytes32) {

        require(buyer != address(0), "Invalid buyer address");
        require(seller != address(0), "Invalid seller address");
        require(buyer != seller, "Buyer and seller match");
        require(id <= sellerLastId[seller], "Invalid order ID");

        bytes32 key = _genKey(buyer, seller, id);
        Order storage sellerOrder = sellerOrders[seller][key];
        Order storage buyerOrder = buyerOrders[buyer][key];

        require(
            sellerOrder.buyer == buyerOrder.buyer &&
            sellerOrder.seller == buyerOrder.seller &&
            sellerOrder.id == buyerOrder.id &&
            sellerOrder.price == buyerOrder.price &&
            sellerOrder.creationDate == buyerOrder.creationDate &&
            sellerOrder.status == buyerOrder.status,
            "Order data mismatch"
        );

        require(sellerOrder.status != OrderStatus.None, "Order does not exist");
        return key;
    }

    /**
     * @dev Removes a specific order ID from the order list
     * @param ids The array of order IDs
     * @param key The order ID to be removed
     */
    function _removeOrderId(bytes32[] storage ids, bytes32 key) private {

        uint256 len = ids.length;

        for (uint256 i = 0; i < len; i++) {
            if (ids[i] == key) {
                ids[i] = ids[len - 1];
                ids.pop();
                break;
            }
        }
    }

    /**
     * @dev Buyer initiates an order
     * @param seller Seller's address
     * @param price Order price in wei
     */
    function buy(address seller, uint256 price) external payable whenNotPaused nonReentrant returns (address, address, uint256) {

        require(msg.value == price, "Incorrect payment amount");

        uint256 id = _createOrder(msg.sender, seller, price);

        emit OrderPaid(msg.sender, seller, id);
        return (msg.sender, seller, id);
    }

    /**
     * @dev Seller accepts a paid order
     * @param buyer Buyer's address
     * @param id Order ID
     * @param price Expected order price
     */
    function sell(address buyer, uint256 id, uint256 price) external whenNotPaused nonReentrant returns (address, address, uint256) {
        bytes32 key = _validateOrder(buyer, msg.sender, id);
        Order storage order = sellerOrders[msg.sender][key];

        require(order.status != OrderStatus.Accepted, "Order already accepted");
        require(order.status != OrderStatus.Completed, "Order already completed");
        require(order.status != OrderStatus.PendingRefund, "A refund has been requested for this order");
        require(order.status != OrderStatus.AcceptedRefund, "A refund has been accepted for this order");
        require(order.status != OrderStatus.DeclinedRefund, "A refund has been declined for this order");
        require(order.status == OrderStatus.Paid, "Invalid order status");

        require(order.price == price, "Price mismatch");

        require(block.timestamp - order.creationDate <= MAX_SELL_DELAY, "Order took too long to be accepted");

        sellerOrders[msg.sender][key].status = OrderStatus.Accepted;
        buyerOrders[buyer][key].status = OrderStatus.Accepted;

        emit OrderAccepted(buyer, msg.sender, id);
        return (buyer, msg.sender, id);
    }

    /**
     * @dev Seller withdraws funds after completion
     * @param buyer Buyer's address
     * @param id Order ID
     */
    function withdrawOrder(address buyer, uint256 id) external whenNotPaused nonReentrant returns (address, address, uint256) {
        bytes32 key = _validateOrder(buyer, msg.sender, id);
        Order storage order = sellerOrders[msg.sender][key];

        require(order.seller == msg.sender, "You are not the seller of this order");

        if(order.status == OrderStatus.Accepted) {
            require(block.timestamp > order.creationDate + WARRANTY, "You cannot withdrawn your funds yet");
        }
        else {
            require(order.status != OrderStatus.Paid, "Order has to be accepted first");
            require(order.status != OrderStatus.Completed, "Order already completed");
            require(order.status != OrderStatus.PendingRefund, "A refund has been requested for this order");
            require(order.status != OrderStatus.AcceptedRefund, "A refund has been accepted for this order");
            require(order.status == OrderStatus.DeclinedRefund, "Invalid order status");
        }

        uint256 amount = order.price * (100 - FEE) / 100;
        uint256 fee = order.price - amount;

        sellerOrders[msg.sender][key].status = OrderStatus.Completed;
        buyerOrders[buyer][key].status = OrderStatus.Completed;

        delete sellerOrders[msg.sender][key];
        _removeOrderId(sellerOrderIds[msg.sender], key);

        delete buyerOrders[buyer][key];
        _removeOrderId(buyerOrderIds[buyer], key);

        payable(msg.sender).transfer(amount);
        payable(owner()).transfer(fee);

        emit OrderWithdrawn(buyer, msg.sender, id);
        return (buyer, msg.sender, id);
    }

    /**
     * @dev Buyer requests refund
     * @param seller Seller's address
     * @param id Order ID
     */
    function requestRefund(address seller, uint256 id) external whenNotPaused nonReentrant returns (address, address, uint256) {
        bytes32 key = _validateOrder(msg.sender, seller, id);
        Order storage order = sellerOrders[seller][key];

        require(order.buyer == msg.sender, "You are not the buyer of this order");

        if(order.status == OrderStatus.Paid) {

            require(block.timestamp - order.creationDate > MAX_SELL_DELAY, "Order has to be accepted first");

            // Automatically complete the order
            sellerOrders[seller][key].status = OrderStatus.Completed;
            buyerOrders[msg.sender][key].status = OrderStatus.Completed;

            delete sellerOrders[seller][key];
            _removeOrderId(sellerOrderIds[seller], key);

            delete buyerOrders[msg.sender][key];
            _removeOrderId(buyerOrderIds[msg.sender], key);

            payable(msg.sender).transfer(order.price);

            emit RefundWithdrawn(msg.sender, seller, id);
            return (msg.sender, seller, id);
            

        }
        else {

            require(order.status != OrderStatus.Completed, "Order already completed");
            require(order.status != OrderStatus.PendingRefund, "A refund has already been requested for this order");
            require(order.status != OrderStatus.AcceptedRefund, "A refund has already been accepted for this order");
            require(order.status != OrderStatus.DeclinedRefund, "A refund has already been declined for this order");
            require(order.status == OrderStatus.Accepted, "Invalid order status");

            require(block.timestamp <= order.creationDate + WARRANTY, "Refund window closed");
        }

        sellerOrders[seller][key].status = OrderStatus.PendingRefund;
        buyerOrders[msg.sender][key].status = OrderStatus.PendingRefund;

        emit RefundRequested(msg.sender, seller, id);
        return (msg.sender, seller, id);
    }

    /**
     * @dev Buyer revokes refund request
     * @param seller Seller's address
     * @param id Order ID
     */
    function revokeRefund(address seller, uint256 id) external whenNotPaused nonReentrant returns (address, address, uint256) {
        bytes32 key = _validateOrder(msg.sender, seller, id);
        Order storage order = sellerOrders[seller][key];

        require(order.buyer == msg.sender, "You are not the buyer of this order");

        require(order.status != OrderStatus.Paid, "No refund has been requested for this order");
        require(order.status != OrderStatus.Accepted, "No refund has been requested for this order");
        require(order.status != OrderStatus.Completed, "No refund has been requested for this order");
        require(order.status != OrderStatus.AcceptedRefund, "A refund has already been accepted for this order");
        require(order.status != OrderStatus.DeclinedRefund, "A refund has already been declined for this order");
        require(order.status == OrderStatus.PendingRefund, "Invalid order status");

        sellerOrders[seller][key].status = OrderStatus.Accepted;
        buyerOrders[msg.sender][key].status = OrderStatus.Accepted;

        emit RefundRevoked(msg.sender, seller, id);
        return (msg.sender, seller, id);
    }

    /**
     * @dev Owner resolves refund request
     * @param buyer Buyer's address
     * @param seller Seller's address
     * @param id Order ID
     * @param newStatus Either AcceptedRefund or DeclinedRefund
     */
    function resolveRefund(address buyer, address seller, uint256 id, OrderStatus newStatus) external whenNotPaused onlyOwner nonReentrant returns (address, address, uint256, OrderStatus) {
        
        require(newStatus == OrderStatus.AcceptedRefund || newStatus == OrderStatus.DeclinedRefund, "Invalid new refund status");

        bytes32 key = _validateOrder(buyer, seller, id);
        Order storage order = sellerOrders[seller][key];

        require(order.status != OrderStatus.Paid, "No refund has been requested for this order");
        require(order.status != OrderStatus.Accepted, "No refund has been requested for this order");
        require(order.status != OrderStatus.Completed, "Order already completed");
        require(order.status != OrderStatus.AcceptedRefund, "A refund has already been accepted for this order");
        require(order.status != OrderStatus.DeclinedRefund, "A refund has already been declined for this order");
        require(order.status == OrderStatus.PendingRefund, "Invalid order status");

        sellerOrders[seller][key].status = newStatus;
        buyerOrders[buyer][key].status = newStatus;
        
        emit RefundResolved(buyer, seller, id, newStatus);
        return (buyer, seller, id, newStatus);
    }

    /**
     * @dev Buyer withdraws approved refund
     * @param seller Seller's address
     * @param id Order ID
     */
    function withdrawRefund(address seller, uint256 id) external whenNotPaused nonReentrant returns (address, address, uint256) {
        bytes32 key = _validateOrder(msg.sender, seller, id);
        Order storage order = sellerOrders[seller][key];

        require(order.buyer == msg.sender, "You are not the buyer of this order");

        require(order.status != OrderStatus.Paid, "No refund has been requested for this order");
        require(order.status != OrderStatus.Accepted, "No refund has been requested for this order");
        require(order.status != OrderStatus.Completed, "No refund has been requested for this order");
        require(order.status != OrderStatus.PendingRefund, "A refund is currently being processed");
        require(order.status != OrderStatus.DeclinedRefund, "A refund has already been declined for this order");
        require(order.status == OrderStatus.AcceptedRefund, "Invalid order status");

        sellerOrders[seller][key].status = OrderStatus.Completed;
        buyerOrders[msg.sender][key].status = OrderStatus.Completed;

        delete sellerOrders[seller][key];
        _removeOrderId(sellerOrderIds[seller], key);

        delete buyerOrders[msg.sender][key];
        _removeOrderId(buyerOrderIds[msg.sender], key);

        payable(msg.sender).transfer(order.price);

        emit RefundWithdrawn(msg.sender, seller, id);
        return (msg.sender, seller, id);
    }

    /**
     * @dev Returns order details
     * @param buyer Buyer's address
     * @param seller Seller's address
     * @param id Order ID
     */
    function getOrder(address buyer, address seller, uint256 id) public view returns (Order memory) {
        bytes32 key = _validateOrder(buyer, seller, id);
        Order storage storedOrder = sellerOrders[seller][key];

        require(
            msg.sender == storedOrder.buyer || 
            msg.sender == storedOrder.seller || 
            msg.sender == owner(),
            "Unauthorized access"
        );

        // Copy storage struct into memory before returning
        Order memory order = Order({
            buyer: storedOrder.buyer,
            seller: storedOrder.seller,
            id: storedOrder.id,
            price: storedOrder.price,
            creationDate: storedOrder.creationDate,
            status: storedOrder.status
        });

        return order;
    }

    function getBuyerOrders(address buyer) public view returns (Order[] memory) {
        
        require(buyer != address(0), "Invalid buyer address");
        require(msg.sender == buyer || msg.sender == owner(), "Unauthorized access");

        uint len = buyerOrderIds[buyer].length;
        Order[] memory orders = new Order[](len);

        for (uint i = 0; i < len; i++) {
            orders[i] = buyerOrders[buyer][buyerOrderIds[buyer][i]];
        }

        return orders;
    }

    function getSellerOrders(address seller) public view returns (Order[] memory) {
        
        require(seller != address(0), "Invalid seller address");
        require(msg.sender == seller || msg.sender == owner(), "Unauthorized access");

        uint len = sellerOrderIds[seller].length;
        Order[] memory orders = new Order[](len);

        for (uint i = 0; i < len; i++) {
            orders[i] = sellerOrders[seller][sellerOrderIds[seller][i]];
        }

        return orders;
    }
}