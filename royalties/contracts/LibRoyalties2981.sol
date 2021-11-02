// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
import "./LibPart.sol";

library LibRoyalties2981 {
    /*
     * https://eips.ethereum.org/EIPS/eip-2981: bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;
     */
    bytes4 constant _INTERFACE_ID_ROYALTIES = 0x2a55205a;
    uint96 constant _WEIGHT_VALUE = 1000000;

    function calculateRoyalties(address to, uint256 amount) internal returns (LibPart.Part[] memory) {
        LibPart.Part[] memory result;
        if (amount == 0) {
            return result;
        }
        uint256 percent = (amount * 100 / _WEIGHT_VALUE);
        result = new LibPart.Part[](1);
        result[0].account = payable(to);
        result[0].value = uint96(percent);
        return result;
    }
    function calculateRoyalty(uint256 amount) internal returns (uint96 result) {
        result = uint96(amount);
        if (amount == 0) {
            return result;
        }
        result = uint96(amount * 100 / _WEIGHT_VALUE);
    }
}
