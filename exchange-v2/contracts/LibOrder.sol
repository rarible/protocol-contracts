// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "./lib/LibMath.sol";
import "@rarible/lib-asset/contracts/LibAsset.sol";
import "./LibOrderDataV2.sol";
import "./LibOrderDataV1.sol";

library LibOrder {
    using SafeMathUpgradeable for uint;

    bytes32 constant ORDER_TYPEHASH = keccak256(
        "Order(address maker,Asset makeAsset,address taker,Asset takeAsset,uint256 salt,uint256 start,uint256 end,bytes4 dataType,bytes data)Asset(AssetType assetType,uint256 value)AssetType(bytes4 assetClass,bytes data)"
    );

    struct Order {
        address maker;
        LibAsset.Asset makeAsset;
        address taker;
        LibAsset.Asset takeAsset;
        uint salt;
        uint start;
        uint end;
        bytes4 dataType;
        bytes data;
    }

    function calculateRemaining(Order memory order, uint fill, bool isMakeFill) internal pure returns (uint makeValue, uint takeValue) {
        if (isMakeFill){
            makeValue = order.makeAsset.value.sub(fill);
            takeValue = LibMath.safeGetPartialAmountFloor(order.takeAsset.value, order.makeAsset.value, makeValue);
        } else {
            takeValue = order.takeAsset.value.sub(fill);
            makeValue = LibMath.safeGetPartialAmountFloor(order.makeAsset.value, order.takeAsset.value, takeValue); 
        } 
    }

    function hashKey(Order memory order) internal pure returns (bytes32) {
        //order.data is in hash for V2 orders
        if (order.dataType == LibOrderDataV2.V2){
            return keccak256(abi.encode(
                order.maker,
                LibAsset.hash(order.makeAsset.assetType),
                LibAsset.hash(order.takeAsset.assetType),
                order.salt,
                order.data
            ));
        } else {
            return keccak256(abi.encode(
                order.maker,
                LibAsset.hash(order.makeAsset.assetType),
                LibAsset.hash(order.takeAsset.assetType),
                order.salt
            ));
        }
        
    }

    function hash(Order memory order) internal pure returns (bytes32) {
        return keccak256(abi.encode(
                ORDER_TYPEHASH,
                order.maker,
                LibAsset.hash(order.makeAsset),
                order.taker,
                LibAsset.hash(order.takeAsset),
                order.salt,
                order.start,
                order.end,
                order.dataType,
                keccak256(order.data)
            ));
    }

    function validate(LibOrder.Order memory order) internal view {
        require(order.start == 0 || order.start < block.timestamp, "Order start validation failed");
        require(order.end == 0 || order.end > block.timestamp, "Order end validation failed");
    }
}
