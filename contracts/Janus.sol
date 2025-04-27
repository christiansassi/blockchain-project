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

    /**  Order storage structure    
                                                                  
                            seller                                buyer                     
                                |                                    |                       
                                |                                    |                       
                                |                                    |                       
                                |                                    |                       
            +------------------------------------------------------------------------+     
            |                                   |                                    |     
            |                                   |                                    |     
            |                                   |                                    |     
            |                                   |                                    |     
            ▼                                   |                                    ▼     
        sellerOrders                             |                               buyerOrders
            ▲                                   |                                    ▲     
            |                                   ▼                                    |     
            |                                  key                                   |     
            |                                   |                                    |     
            |                                   |                                    |     
            |                                   |                                    |     
            |                 +-----------------|-------------------+                |     
            |                 |                                     |                |     
            |                 |                                     |                |     
            |                 |                                     |                |     
            |                 ▼                                     ▼                |     
            |           sellerIndexes                         buyerIndexes           |     
            |                 |                                     |                |     
            |                 |                                     |                |     
            |                 |                                     |                |     
            |                 |                                     |                |     
            +-----------------+                                     +----------------+  
   
    **/
    
    mapping(address => Order[]) private sellerOrders;
    mapping(address => mapping(bytes32 => Index)) private sellerIndexes;

    mapping(address => Order[]) private buyerOrders;
    mapping(address => mapping(bytes32 => Index)) private buyerIndexes;

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

        uint256 id = sellerOrders[seller].length;
        bytes32 key = _genKey(buyer, seller, id);

        if(buyerOrders[buyer].length != 0)
        {
            Index memory buyerIndex = buyerIndexes[buyer][key];
            require(!buyerIndex.isSet, "Order already exists");
        }
        
        if(sellerOrders[seller].length != 0)
        {
            Index memory sellerIndex = sellerIndexes[seller][key];
            require(!sellerIndex.isSet, "Order already exists");
        }

        Order memory order = Order({
            buyer: buyer,
            seller: seller,
            id: id,
            price: price,
            creationDate: block.timestamp,
            status: OrderStatus.Paid
        });

        buyerOrders[buyer].push(order);
        buyerIndexes[buyer][key] = Index({
            index: buyerOrders[buyer].length - 1,
            isSet: true
        });

        sellerOrders[seller].push(order);
        sellerIndexes[seller][key] = Index({
            index: sellerOrders[seller].length - 1,
            isSet: true
        });

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
        require(id < sellerOrders[seller].length, "Invalid order ID");

        bytes32 key = _genKey(buyer, seller, id);

        Index storage buyerIndex = buyerIndexes[buyer][key];
        Index storage sellerIndex = sellerIndexes[seller][key];

        require(buyerIndex.isSet && sellerIndex.isSet, "Order does not exists");

        Order storage buyerOrder = buyerOrders[buyer][buyerIndex.index];
        Order storage sellerOrder = sellerOrders[seller][sellerIndex.index];

        require(
            buyerOrder.buyer == sellerOrder.buyer &&
            buyerOrder.seller == sellerOrder.seller &&
            buyerOrder.id == sellerOrder.id &&
            buyerOrder.price == sellerOrder.price &&
            buyerOrder.creationDate == sellerOrder.creationDate &&
            buyerOrder.status == sellerOrder.status,
            "Order data mismatch"
        );

        return key;
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

        Index storage sellerIndex = sellerIndexes[msg.sender][key];
        Order storage order = sellerOrders[msg.sender][sellerIndex.index];

        require(order.status != OrderStatus.Accepted, "Order already accepted");
        require(order.status != OrderStatus.Completed, "Order already completed");
        require(order.status != OrderStatus.PendingRefund, "A refund has been requested for this order");
        require(order.status != OrderStatus.AcceptedRefund, "A refund has been accepted for this order");
        require(order.status != OrderStatus.DeclinedRefund, "A refund has been declined for this order");
        require(order.status == OrderStatus.Paid, "Invalid order status");

        require(order.price == price, "Price mismatch");

        require(block.timestamp - order.creationDate <= MAX_SELL_DELAY, "Order took too long to be accepted");

        sellerOrders[msg.sender][sellerIndex.index].status = OrderStatus.Accepted;

        Index storage buyerIndex = buyerIndexes[buyer][key];
        buyerOrders[buyer][buyerIndex.index].status = OrderStatus.Accepted;

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
        Index storage sellerIndex = sellerIndexes[msg.sender][key];
        Order storage order = sellerOrders[msg.sender][sellerIndex.index];

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

        sellerOrders[msg.sender][sellerIndex.index].status = OrderStatus.Completed;

        Index storage buyerIndex = buyerIndexes[buyer][key];
        buyerOrders[buyer][buyerIndex.index].status = OrderStatus.Completed;

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
        Index storage sellerIndex = sellerIndexes[seller][key];
        Order storage order = sellerOrders[seller][sellerIndex.index];

        require(order.buyer == msg.sender, "You are not the buyer of this order");

        Index storage buyerIndex = buyerIndexes[msg.sender][key];

        if(order.status == OrderStatus.Paid) {

            require(block.timestamp - order.creationDate > MAX_SELL_DELAY, "Order has to be accepted first");

            // Automatically complete the order
            sellerOrders[seller][sellerIndex.index].status = OrderStatus.Completed;
            buyerOrders[msg.sender][buyerIndex.index].status = OrderStatus.Completed;

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

        sellerOrders[seller][sellerIndex.index].status = OrderStatus.PendingRefund;
        buyerOrders[msg.sender][buyerIndex.index].status = OrderStatus.PendingRefund;

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
        Index storage sellerIndex = sellerIndexes[seller][key];
        Order storage order = sellerOrders[seller][sellerIndex.index];

        require(order.buyer == msg.sender, "You are not the buyer of this order");

        require(order.status != OrderStatus.Paid, "No refund has been requested for this order");
        require(order.status != OrderStatus.Accepted, "No refund has been requested for this order");
        require(order.status != OrderStatus.Completed, "No refund has been requested for this order");
        require(order.status != OrderStatus.AcceptedRefund, "A refund has already been accepted for this order");
        require(order.status != OrderStatus.DeclinedRefund, "A refund has already been declined for this order");
        require(order.status == OrderStatus.PendingRefund, "Invalid order status");

        sellerOrders[seller][sellerIndex.index].status = OrderStatus.Accepted;

        Index storage buyerIndex = buyerIndexes[msg.sender][key];
        buyerOrders[msg.sender][buyerIndex.index].status = OrderStatus.Accepted;

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
        Index storage sellerIndex = sellerIndexes[seller][key];
        Order storage order = sellerOrders[seller][sellerIndex.index];

        require(order.status != OrderStatus.Paid, "No refund has been requested for this order");
        require(order.status != OrderStatus.Accepted, "No refund has been requested for this order");
        require(order.status != OrderStatus.Completed, "Order already completed");
        require(order.status != OrderStatus.AcceptedRefund, "A refund has already been accepted for this order");
        require(order.status != OrderStatus.DeclinedRefund, "A refund has already been declined for this order");
        require(order.status == OrderStatus.PendingRefund, "Invalid order status");

        sellerOrders[seller][sellerIndex.index].status = newStatus;

        Index storage buyerIndex = buyerIndexes[buyer][key];
        buyerOrders[buyer][buyerIndex.index].status = newStatus;
        
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
        Index storage sellerIndex = sellerIndexes[seller][key];
        Order storage order = sellerOrders[seller][sellerIndex.index];

        require(order.buyer == msg.sender, "You are not the buyer of this order");

        require(order.status != OrderStatus.Paid, "No refund has been requested for this order");
        require(order.status != OrderStatus.Accepted, "No refund has been requested for this order");
        require(order.status != OrderStatus.Completed, "No refund has been requested for this order");
        require(order.status != OrderStatus.PendingRefund, "A refund is currently being processed");
        require(order.status != OrderStatus.DeclinedRefund, "A refund has already been declined for this order");
        require(order.status == OrderStatus.AcceptedRefund, "Invalid order status");

        sellerOrders[seller][sellerIndex.index].status = OrderStatus.Completed;

        Index storage buyerIndex = buyerIndexes[msg.sender][key];
        buyerOrders[msg.sender][buyerIndex.index].status = OrderStatus.Completed;

        payable(msg.sender).transfer(order.price);

        emit RefundWithdrawn(msg.sender, seller, id);
        return (msg.sender, seller, id);
    }

    /**
    * @dev Returns the order details for a given buyer, seller, and order ID.
    * @param buyer Address of the buyer.
    * @param seller Address of the seller.
    * @param id Unique identifier of the order.
    * @return The requested Order.
    */
    function getOrder(address buyer, address seller, uint256 id) public view returns (Order memory) {
        bytes32 key = _validateOrder(buyer, seller, id);
        Index storage sellerIndex = sellerIndexes[seller][key];
        Order storage order = sellerOrders[seller][sellerIndex.index];

        require(msg.sender == order.buyer || msg.sender == order.seller || msg.sender == owner(), "Unauthorized access");
        return order;
    }

    /**
    * @dev Returns the number of orders placed by the caller as a buyer.
    * @return Total number of buyer orders.
    */
    function getBuyerOrdersLength() public view returns (uint256) {
        return buyerOrders[msg.sender].length;
    }

    /**
    * @dev Returns the buyer's order at a specific index.
    * @param index Index of the order in the buyer's order list.
    * @return The requested Order.
    */
    function getBuyerOrder(uint256 index) public view returns (Order memory) {
        require(index < buyerOrders[msg.sender].length, "Invalid index");
        return buyerOrders[msg.sender][index];
    }

    /**
    * @dev Returns the number of orders associated with the caller as a seller.
    * @return Total number of seller orders.
    */
    function getSellerOrdersLength() public view returns (uint256) {
        return sellerOrders[msg.sender].length;
    }

    /**
    * @dev Returns the seller's order at a specific index.
    * @param index Index of the order in the seller's order list.
    * @return The requested Order struct.
    */
    function getSellerOrder(uint256 index) public view returns (Order memory) {
        require(index < sellerOrders[msg.sender].length, "Invalid index");
        return sellerOrders[msg.sender][index];
    }

}