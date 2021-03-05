pragma solidity ^0.7.0;
pragma abicoder v2;

import "../../../contracts/exchange/v2/LibOrder.sol";
import "../../../contracts/exchange/v2/LibFill.sol";

contract LibFillTest {
    function fillOrder(LibOrder.Order calldata leftOrder, LibOrder.Order calldata rightOrder, uint leftOrderFill, uint rightOrderFill) external pure returns (LibFill.FillResult memory) {
        return LibFill.fillOrder(leftOrder, rightOrder, leftOrderFill, rightOrderFill);
    }
}
