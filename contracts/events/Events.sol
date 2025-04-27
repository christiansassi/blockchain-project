// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../enums/OrderStatus.sol";

/// @dev Events interface for the Janus contract.
interface Events {

    event NewOrdersPaused(address indexed owner);
    event NewOrdersUnpaused(address indexed owner);

    event OrderPaid(address indexed buyer, address indexed seller, uint256 id);
    event OrderAccepted(address indexed buyer, address indexed seller, uint256 id);
    event OrderWithdrawn(address indexed buyer, address indexed seller, uint256 id);

    event RefundRequested(address indexed buyer, address indexed seller, uint256 id);
    event RefundRevoked(address indexed buyer, address indexed seller, uint256 id);
    event RefundResolved(address indexed buyer, address indexed seller, uint256 id, OrderStatus newStatus);
    event RefundWithdrawn(address indexed buyer, address indexed seller, uint256 id);
}