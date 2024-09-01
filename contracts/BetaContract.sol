// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.19;

contract BetaContract {

    // Struct to manage users
    struct User {
        mapping (uint => Order) orders; // List of orders
        uint latestOrderId; // Latest order id

        // User's score as buyer. This is used to check user's reliability as buyer
        uint buyerScore;
        uint buyerScorePercentage;

        // User's score as seller. This is used to check user's reliability as seller
        uint sellerScore;
        uint sellerScorePercentage;
    }

    enum RefundState {
        none, //      [0] Refund not requested
        pending, //   [1] Refund has been requested and it has been analyzed
        accepted, //  [2] Refund has been requested and accepted
        declined //   [3] Refund has been requested and declined
    }

    // Struct to manage orders
    struct Order {
        address buyer; // Buyer
        address seller; // Seller

        uint price; // Product price
        uint id; // Order id
        uint time; // Order time
        uint warrantyTime; // Warranty time

        RefundState refundState;

        bool completed;
    }

    // List of users
    mapping (address => User) users;

    // Owner's address
    address private owner;

    // Set contract creator as the initial owner
    constructor() {
        owner = msg.sender;
    }

    /**
    * @dev Gets current owner.
    * @return Owner's address.
    */
    function getOwner() public view returns(address) {
        return owner;
    }

    /**
    * @dev Set a new owner.
    * @param newOwner New owner's address.
    */
    function setOwner(address newOwner) public {
        require(msg.sender == owner, "Only the owner can set a new owner");

        owner = newOwner;
    }

    /**
    * @dev Creates a new order. TO BE USED BY THE SELLER
    * @param buyer The address of the buyer.
    * @param price The cost of the product.
    * @return The ID of the order. This will be used by the buyer to complete the order.
    */
    function sell(address buyer, uint price, uint warrantyTime) public returns (uint) {
    
        // The buyer cannot be the seller
        require(buyer != msg.sender, "Invalid buyer address");

        // Price must be greater than zero
        require(price > 0, "Price must be greater than zero");

        // Create a new order
        Order memory order;

        order.buyer = buyer;
        order.seller = msg.sender;

        order.price = price;
        order.id = ++users[msg.sender].latestOrderId;
        // order.time = to be filled in the buy function
        order.warrantyTime = warrantyTime;

        order.refundState = RefundState.none;
        
        order.completed = false;

        // Save the order
        users[msg.sender].orders[order.id] = order;

        // Return the order ID. The seller must provide this ID to the buyer.
        return order.id;
    }

    /**
    * @dev Completes an order previously created by the seller. TO BE USED BY THE BUYER
    * @param seller The address of the seller.
    * @param price The cost of the product.
    * @param id The ID of the order.
    */
    function buy(address seller, uint price, uint id, uint warrantyTime) public payable {

        // The seller cannot sell to themselves
        require(seller != msg.sender, "Invalid seller address");

        // Validate the price
        // Perform this validation before the second price check, as we are not yet accessing the order.
        // This allows us to catch errors early, interrupt the function and save on gas costs.
        require(price != 0, "Price cannot be zero");
        require(price == msg.value, "Incorrect payment amount sent");

        // Retrieve the order
        Order storage order = users[seller].orders[id];

        // Validate the order details
        // If one of these fails, it could be due to two reasons:
        // - The seller has not created the order yet
        // - A buyer is trying to access an order that is not theirs

        require(order.buyer == msg.sender, "You are not the buyer for this order"); 

        // Check if the buyer is trying to access an already completed order
        // This is inserted after the previous "require" instruction to avoid information leakage of orders belonging to other users
        // Check this field first, so it is possible to save on gas costs.
        require(!order.completed, "Order already completed");

        require(order.seller == seller, "Seller address does not match");
        require(order.price == price, "Order price does not match");
        require(order.id == id, "Order ID does not match");
        require(order.warrantyTime == warrantyTime, "Order warranty time does not match");

        // Complete the missing information inside the order
        order.time = block.timestamp;
    }

    /**
    * @dev Gets the state for the specified order. TO BE USED BY THE SELLER
    * @param id The ID of the order.
    * @return The state of the order. True if it is completed, false otherwise.
    */
    function getOrderState(uint id) public view returns(bool) {
        
        Order memory order = users[msg.sender].orders[id];

        require(order.time != 0, "Order does not exist");

        return order.completed;
    }

    /**
    * @dev Gets the state for the specified order. TO BE USED BY THE BUYER
    * @param seller The address of the seller.
    * @param id The ID of the order.
    * @return The state of the order. True if it is completed, false otherwise.
    */
    function getOrderState(address seller, uint id) public view returns(bool) {
        
        Order memory order = users[seller].orders[id];

        require(order.buyer == msg.sender, "You are not the buyer for this order"); 

        return order.completed;
    }

    /**
    * @dev Requests a refund for the specified order. TO BE USED BY THE BUYER
    * @param seller The address of the seller.
    * @param id The ID of the order.
    */
    function requestRefund(address seller, uint id) public {

        Order storage order = users[seller].orders[id];

        require(order.buyer == msg.sender, "You are not the buyer for this order"); 

        require(!order.completed, "Order already completed");

        require(order.refundState != RefundState.pending, "A refund has been requested. Wait untill it will be accepted or declined");
        require(order.refundState != RefundState.accepted, "A refund has been requested and accepted");
        require(order.refundState != RefundState.declined, "A refund has been requested and declined");

        // Request refund
        order.refundState = RefundState.pending;
    }

    /**
    * @dev Updates the state of a refund request. TO BE USED BY THE OWNER
    * @param seller The address of the seller.
    * @param id The ID of the order.
    * @param newRefundState New refund state
    */
    function updateRefundState(address seller, uint id, RefundState newRefundState) public {

        require(msg.sender == owner, "Only the owner can update the state of a refund request");

        Order storage order = users[seller].orders[id];

        require(order.time != 0, "Order does not exist");
        require(!order.completed, "Order already completed");

        // Set new refund state
        order.refundState = newRefundState;
    }

    /**
    * @dev Gets the state for the specified refund request. TO BE USED BY THE SELLER
    * @param id The ID of the order.
    * @return The state of the refund request.
    */
    function getRefundState(uint id) public view returns(uint) {

        Order memory order = users[msg.sender].orders[id];

        require(order.time != 0, "Order does not exist");

        return uint(order.refundState);
    }

    /**
    * @dev Gets the state for the specified refund request. TO BE USED BY THE BUYER
    * @param seller The address of the seller.
    * @param id The ID of the order.
    * @return The state of the refund request.
    */
    function getRefundState(address seller, uint id) public view returns(uint) {

        Order memory order = users[seller].orders[id];

        require(order.buyer == msg.sender, "You are not the buyer for this order"); 

        return uint(order.refundState);
    }

    /**
     * @dev Support function to timeUntilWithdrawal(uint id) and timeUntilWithdrawal(address seller, uint id)
     * @param order Order to be checked
     * @return Time left.
     */
    function _timeUntilWithdrawal(Order memory order) private view returns(uint) {

        // Calculate time left
        int time_left = int(order.time + order.warrantyTime) - int(block.timestamp);

        return (time_left >= 0) ? uint(time_left) : 0;
    }

    /**
     * @dev Calculates the time left before being able to withdraw an order.
     * @param id Order's ID.
     * @return Time left.
     */
    function timeUntilWithdrawal(uint id) public view returns(uint){

        Order memory order = users[msg.sender].orders[id];

        require(order.time != 0, "Order does not exist");

        return _timeUntilWithdrawal(order);
    }

    /**
     * @dev Calculates the time left before seller is being able to withdraw an order.
     * @param seller Seller's address.
     * @param id Order's ID.
     * @return Time left.
     */
    function timeUntilWithdrawal(address seller, uint id) public view returns(uint){

        Order memory order = users[seller].orders[id];

        require(order.time != 0, "Order does not exist");
        require(order.buyer == msg.sender, "You are not the buyer for this order");

        return _timeUntilWithdrawal(order);
    }
    
    /**
    * @dev Collects, if possible, the specified order. TO BE USED BY THE SELLER
    * @param id The ID of the order.
    */
    function collectOrder(uint id) public payable {

        Order storage order = users[msg.sender].orders[id];

        require(order.time != 0, "Order does not exist");
        
        if(order.completed)
        {
            // Order is completed, meaning that funds have been transfer to the buyer
            require(order.refundState != RefundState.accepted, "Order completed: a refund has been requested and accepted. You cannot collect your order");

            // Order is completed
            require(!order.completed, "Order already completed");
        }
        else 
        {
            // If there is a pending refund request, seller cannot collect the order. He has to wait until the owner accept or decline it
            require(order.refundState != RefundState.pending, "A refund has been requested. Wait untill it will be accepted or declined");

            // If a refund has been requested and accepted, it means that funds are destinated to the buyer and only him can set the order as completed
            require(order.refundState != RefundState.accepted, "A refund has been requested and accepted. You cannot collect your order");

            // A seller cannot claim his order before the warranty time
            require(timeUntilWithdrawal(id) == 0, "You cannot collect your order yet");
        }

        // Set order as completed
        order.completed = true;

        // Transfer funds to the seller
        payable(msg.sender).transfer(order.price);
    }

    /**
    * @dev Collects, if possible, the refund associated to the specified order. TO BE USED BY THE BUYER
    * @param seller Seller's address.
    * @param id The ID of the order.
    */
    function collectRefund(address seller, uint id) public payable {

        Order storage order = users[seller].orders[id];

        require(order.time != 0, "Order does not exist");
        require(order.buyer == msg.sender, "You are not the buyer for this order");
        
        if(order.completed)
        {
            // Order is completed, meaning that funds have already been transfer to the seller
            require(order.refundState != RefundState.declined, "Order completed: a refund has been requested and declined. You cannot collect your funds");

            // Order is completed
            require(!order.completed, "Order already completed");
        }
        else
        {
            // If there is a pending refund request, buyer cannot collect funds (yet)
            require(order.refundState != RefundState.pending, "A refund has been requested. Wait untill it will be accepted or declined");

            // If a refund has been requested and declined, it means that funds are destinated to the seller and only him can set the order as completed
            require(order.refundState != RefundState.declined, "A refund has been requested and accepted. You cannot collect your funds");
        }

        // Set order as completed
        order.completed = true;

        // Transfer funds to the seller
        payable(msg.sender).transfer(order.price);
    }
}