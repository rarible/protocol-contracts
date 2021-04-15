// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "../../../contracts/LibOrder.sol";
import "../../../contracts/LibFill.sol";

contract LibFillTest {
    function fillOrder(LibOrder.Order calldata leftOrder, LibOrder.Order calldata rightOrder, uint leftOrderFill, uint rightOrderFill) external pure returns (LibFill.FillResult memory) {
        return LibFill.fillOrder(leftOrder, rightOrder, leftOrderFill, rightOrderFill);
    }
}
