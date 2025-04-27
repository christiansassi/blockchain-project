// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../enums/OrderStatus.sol";

/// @dev Order struct containing all the necessary details about an order.
struct Order {
    address buyer;
    address seller;
    uint256 id;
    uint256 price;
    uint256 creationDate;
    OrderStatus status;
}

struct Index {
    uint256 index;
    bool isSet;
}
