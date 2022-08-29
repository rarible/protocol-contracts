// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "../libraries/LibSeaPort.sol";

interface ISeaPort {
    function fulfillAdvancedOrder(
        LibSeaPort.AdvancedOrder calldata advancedOrder,
        LibSeaPort.CriteriaResolver[] calldata criteriaResolvers,
        bytes32 fulfillerConduitKey,
        address recipient
    ) external payable returns (bool fulfilled);

    function fulfillAvailableAdvancedOrders(
        LibSeaPort.AdvancedOrder[] memory advancedOrders,
        LibSeaPort.CriteriaResolver[] calldata criteriaResolvers,
        LibSeaPort.FulfillmentComponent[][] calldata offerFulfillments,
        LibSeaPort.FulfillmentComponent[][] calldata considerationFulfillments,
        bytes32 fulfillerConduitKey,
        address recipient,
        uint256 maximumFulfilled
    ) external payable returns (bool[] memory availableOrders, LibSeaPort.Execution[] memory executions);

    function fulfillBasicOrder(LibSeaPort.BasicOrderParameters calldata parameters)
        external
        payable
        returns (bool fulfilled);
}