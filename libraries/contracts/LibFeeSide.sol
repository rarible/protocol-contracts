// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@rarible/lib-asset/contracts/LibAsset.sol";

library LibFeeSide {

    //todo this should be changed to LEFT/RIGHT? MAKE/TAKE is only for Orders, where are maker and taker
    enum FeeSide {NONE, MAKE, TAKE}

    function getFeeSide(bytes4 make, bytes4 take) internal pure returns (FeeSide) {
        if (make == LibAsset.ETH_ASSET_CLASS) {
            return FeeSide.MAKE;
        }
        if (take == LibAsset.ETH_ASSET_CLASS) {
            return FeeSide.TAKE;
        }
        if (make == LibAsset.ERC20_ASSET_CLASS) {
            return FeeSide.MAKE;
        }
        if (take == LibAsset.ERC20_ASSET_CLASS) {
            return FeeSide.TAKE;
        }
        if (make == LibAsset.ERC1155_ASSET_CLASS) {
            return FeeSide.MAKE;
        }
        if (take == LibAsset.ERC1155_ASSET_CLASS) {
            return FeeSide.TAKE;
        }
        return FeeSide.NONE;
    }
}
