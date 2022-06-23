// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../contracts/libraries/LibOrder.sol";
import "../../contracts/libraries/LibFill.sol";

contract LibFillTest {
    function fillOrder(LibOrder.Order calldata leftOrder, LibOrder.Order calldata rightOrder, uint leftOrderFill, uint rightOrderFill, bool leftIsMakeFill, bool rightIsMakeFill) external pure returns (LibFill.FillResult memory) {
        return LibFill.fillOrder(leftOrder, rightOrder, leftOrderFill, rightOrderFill, leftIsMakeFill, rightIsMakeFill);
    }
}
