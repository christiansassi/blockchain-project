// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @dev Enum representing the status of an order.
enum OrderStatus {
    None,           // 0
    Paid,           // 1
    Accepted,       // 2
    Completed,      // 3
    PendingRefund,  // 4
    AcceptedRefund, // 5
    DeclinedRefund  // 6
}
