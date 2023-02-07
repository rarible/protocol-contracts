// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;
pragma abicoder v2;

import {Input, Order} from "../libraries/OrderStructs.sol";

interface IBlurExchange {
    function nonces(address) external view returns (uint256);

    function cancelOrder(Order calldata order) external;

    function cancelOrders(Order[] calldata orders) external;

    function incrementNonce() external;

    function execute(Input calldata sell, Input calldata buy)
        external
        payable;
}
