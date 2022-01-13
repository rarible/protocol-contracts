// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../../contracts/LibOrder.sol";

contract LibOrderTest {
    function calculateRemaining(LibOrder.Order calldata order, uint fill, bool isMakeFill) external pure returns (uint makeAmount, uint takeAmount) {
        return LibOrder.calculateRemaining(order, fill, isMakeFill);
    }

    function hashKey(LibOrder.Order calldata order) external pure returns (bytes32) {
        return LibOrder.hashKey(order, false);
    }

    function hashKeyOnChain(LibOrder.Order calldata order) external pure returns (bytes32) {
        return LibOrder.hashKey(order, true);
    }

    function validate(LibOrder.Order calldata order) external view {
        LibOrder.validate(order);
    }

    function hashV2(address maker, LibAsset.Asset memory makeAsset, LibAsset.Asset memory takeAsset, uint salt, bytes memory data) public pure returns(bytes32){
        return keccak256(abi.encode(
                maker,
                LibAsset.hash(makeAsset.assetType),
                LibAsset.hash(takeAsset.assetType),
                salt,
                data
            ));
    }

    function hashV1(address maker, LibAsset.Asset memory makeAsset, LibAsset.Asset memory takeAsset, uint salt) public pure returns(bytes32){
        return keccak256(abi.encode(
                maker,
                LibAsset.hash(makeAsset.assetType),
                LibAsset.hash(takeAsset.assetType),
                salt
            ));
    }

}
