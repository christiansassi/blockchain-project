// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./security/Pausable.sol";
import "./security/ReentrancyGuard.sol";
import "./access/Ownable.sol";

import "./structs/Order.sol";
import "./enums/OrderStatus.sol";
import "./events/Events.sol";

/**
* @dev For more info: https://github.com/christiansassi/blockchain-project
*/
contract Janus is Ownable, Pausable, ReentrancyGuard, Events {
    
    mapping(address => mapping(address => Order[])) private orders; // seller -> buyer -> orders
    mapping(address => mapping(bytes32 => Index)) private indexes; // seller -> key -> index
    mapping(address => Order[]) private ordersList; // seller -> orders
    mapping(address => uint256) private ids; // seller -> current id

    uint8 private constant FEE = 1; // 1% platform fee
    uint32 private constant MAX_SELL_DELAY = 24 * 60 * 60; // 24 hours
    uint32 private constant WARRANTY = 30 * 24 * 60 * 60; // 30 days
    uint256 private immutable CREATION_BLOCK_NUMBER;

    bool private newOrderPaused = false;

    constructor() Ownable(msg.sender) {
        CREATION_BLOCK_NUMBER = block.number;
    }

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
    * @dev Returns whether the contract is paused.
    * @return `true` if the contract is paused, `false` otherwise.
    */
    function isPaused() public view returns (bool) {
        return paused();
    }

    /**
    * @dev Pauses the creation of new orders. 
    */
    function pauseNewOrders() external onlyOwner {
        newOrderPaused = true;
        emit NewOrdersPaused(owner());
    }

    /**
    * @dev Unpauses the creation of new orders, allowing new orders to be created.
    */
    function unpauseNewOrders() external onlyOwner {
        newOrderPaused = false;
        emit NewOrdersUnpaused(owner());
    }

    /**
    * @dev Returns whether new orders are paused.
    * @return `true` if new orders are paused, `false` otherwise.
    */
    function areNewOrdersPaused() public view returns (bool) {
        return newOrderPaused;
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
    * @dev Returns the creation block number.
    * @return The creation block number.
    */
    function getCreationBlockNumber() public view returns (uint256) {
        return CREATION_BLOCK_NUMBER;
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

        uint256 id = ids[seller]++;
        bytes32 key = _genKey(buyer, seller, id);

        require(!indexes[seller][key].isSet, "Order already exists");

        Order memory order = Order({
            buyer: buyer,
            seller: seller,
            id: id,
            price: price,
            creationDate: block.timestamp,
            status: OrderStatus.Paid
        });

        orders[seller][buyer].push(order);
        indexes[seller][key] = Index({
            index: orders[seller][buyer].length - 1,
            isSet: true
        });

        ordersList[seller].push(order);

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
        // require(id < orders[seller][buyer].length, "Invalid order ID");

        bytes32 key = _genKey(buyer, seller, id);

        require(indexes[seller][key].isSet, "Order does not exists");

        return key;
    }

    /**
    * @dev Buyer initiates an order
    * @param seller Seller's address
    * @param price Order price in wei
    */
    function buy(address seller, uint256 price) external payable whenNotPaused nonReentrant returns (address, address, uint256) {

        require(!newOrderPaused, "New orders cannot be created at this time.");
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

        require(!newOrderPaused, "New orders cannot be created at this time.");

        bytes32 key = _validateOrder(buyer, msg.sender, id);

        Index memory index = indexes[msg.sender][key];
        Order storage order = orders[msg.sender][buyer][index.index];

        require(order.status != OrderStatus.Accepted, "Order already accepted");
        require(order.status != OrderStatus.Completed, "Order already completed");
        require(order.status != OrderStatus.PendingRefund, "A refund has been requested for this order");
        require(order.status != OrderStatus.AcceptedRefund, "A refund has been accepted for this order");
        require(order.status != OrderStatus.DeclinedRefund, "A refund has been declined for this order");
        require(order.status == OrderStatus.Paid, "Invalid order status");

        require(order.price == price, "Price mismatch");

        require(block.timestamp - order.creationDate <= MAX_SELL_DELAY, "Order took too long to be accepted");

        order.status = OrderStatus.Accepted;
        ordersList[msg.sender][order.id].status = OrderStatus.Accepted;

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
        Index memory index = indexes[msg.sender][key];
        Order storage order = orders[msg.sender][buyer][index.index];

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

        order.status = OrderStatus.Completed;
        ordersList[msg.sender][order.id].status = OrderStatus.Completed;

        // payable(msg.sender).transfer(amount);
        // payable(owner()).transfer(fee);

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Funds transfer failed");

        (ok, ) = payable(owner()).call{value: fee}("");
        require(ok, "Fee transfer failed");

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
        Index memory index = indexes[seller][key];
        Order storage order = orders[seller][msg.sender][index.index];

        require(order.buyer == msg.sender, "You are not the buyer of this order");

        if(order.status == OrderStatus.Paid) {

            require(block.timestamp - order.creationDate > MAX_SELL_DELAY, "Order has to be accepted first");

            // Automatically complete the order
            order.status = OrderStatus.Completed;
            ordersList[seller][order.id].status = OrderStatus.Completed;

            // payable(msg.sender).transfer(order.price);

            (bool ok, ) = payable(msg.sender).call{value: order.price}("");
            require(ok, "Funds transfer failed");

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

        order.status = OrderStatus.PendingRefund;
        ordersList[seller][order.id].status = OrderStatus.PendingRefund;

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
        Index memory index = indexes[seller][key];
        Order storage order = orders[seller][msg.sender][index.index];

        require(order.buyer == msg.sender, "You are not the buyer of this order");

        require(order.status != OrderStatus.Paid, "No refund has been requested for this order");
        require(order.status != OrderStatus.Accepted, "No refund has been requested for this order");
        require(order.status != OrderStatus.Completed, "No refund has been requested for this order");
        require(order.status != OrderStatus.AcceptedRefund, "A refund has already been accepted for this order");
        require(order.status != OrderStatus.DeclinedRefund, "A refund has already been declined for this order");
        require(order.status == OrderStatus.PendingRefund, "Invalid order status");

        order.status = OrderStatus.Accepted;
        ordersList[seller][order.id].status = OrderStatus.Accepted;

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
        Index memory index = indexes[seller][key];
        Order storage order = orders[seller][buyer][index.index];

        require(order.status != OrderStatus.Paid, "No refund has been requested for this order");
        require(order.status != OrderStatus.Accepted, "No refund has been requested for this order");
        require(order.status != OrderStatus.Completed, "Order already completed");
        require(order.status != OrderStatus.AcceptedRefund, "A refund has already been accepted for this order");
        require(order.status != OrderStatus.DeclinedRefund, "A refund has already been declined for this order");
        require(order.status == OrderStatus.PendingRefund, "Invalid order status");

        order.status = newStatus;
        ordersList[seller][order.id].status = newStatus;

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
        Index memory index = indexes[seller][key];
        Order storage order = orders[seller][msg.sender][index.index];

        require(order.buyer == msg.sender, "You are not the buyer of this order");

        require(order.status != OrderStatus.Paid, "No refund has been requested for this order");
        require(order.status != OrderStatus.Accepted, "No refund has been requested for this order");
        require(order.status != OrderStatus.Completed, "No refund has been requested for this order");
        require(order.status != OrderStatus.PendingRefund, "A refund is currently being processed");
        require(order.status != OrderStatus.DeclinedRefund, "A refund has already been declined for this order");
        require(order.status == OrderStatus.AcceptedRefund, "Invalid order status");

        order.status = OrderStatus.Completed;
        ordersList[seller][order.id].status = OrderStatus.Completed;

        //payable(msg.sender).transfer(order.price);
        (bool ok, ) = payable(msg.sender).call{value: order.price}("");
        require(ok, "Refund withdrawal failed");

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
    function getOrder(address buyer, address seller, uint256 id) external view whenNotPaused returns (Order memory) {
        bytes32 key = _validateOrder(buyer, seller, id);
        Index memory index = indexes[seller][key];
        Order memory order = orders[seller][buyer][index.index];

        require(msg.sender == order.buyer || msg.sender == order.seller || msg.sender == owner(), "Unauthorized access");
        return order;
    }

    /**
    * @dev Returns the total number of orders placed by the caller with a specific seller.
    * @param seller Address of the seller.
    * @return The number of orders the caller has with the given seller.
    */
    function getOrderCountFromSeller(address seller) external view whenNotPaused returns (uint256) {
        return orders[seller][msg.sender].length;
    }

    /**
    * @dev Returns the order details at a specific index for a given seller and the caller.
    * @param seller Address of the seller.
    * @param index Index of the order in the seller's order list for the caller.
    * @return The requested Order.
    */
    function getOrderAtIndexFromSeller(address seller, uint256 index) external view whenNotPaused returns (Order memory) {

        require(index < orders[seller][msg.sender].length, "Invalid index");

        return orders[seller][msg.sender][index];
    }

    /**
    * @dev Returns the total number of orders where the caller is the seller.
    * @return The number of orders associated with the caller as a seller.
    */
    function getOrderCountAsSeller() external view whenNotPaused returns (uint256) {
        return ordersList[msg.sender].length;
    }

    /**
    * @dev Returns the order details at a specific index where the caller is the seller.
    * @param index Index of the order in the caller's order list.
    * @return The requested Order.
    */
    function getOrderAtIndexAsSeller(uint256 index) external view whenNotPaused returns (Order memory) {
        require(index < ordersList[msg.sender].length, "Invalid index");
        return ordersList[msg.sender][index];
    }
}
