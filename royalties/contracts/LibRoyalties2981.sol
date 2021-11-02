// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
import "./LibPart.sol";

library LibRoyalties2981 {
    /*
     * https://eips.ethereum.org/EIPS/eip-2981: bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;
     */
    bytes4 constant _INTERFACE_ID_FEES = 0x2a55205a;
    uint96 constant _WEIGHT_VALUE = 1000000;

    function calculateRoyalties(address payable to, uint96 amount) internal returns (LibPart.Part[] memory) {
        LibPart.Part[] memory result;
        if (amount == 0) {
            return result;
        }
        uint96 percent = (amount * 100/ _WEIGHT_VALUE);
        result = new LibPart.Part[](1);
        result[0].account = to;
        result[0].value = percent;
        return result;
    }
}
