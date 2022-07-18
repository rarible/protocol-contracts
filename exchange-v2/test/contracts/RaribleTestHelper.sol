// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

import "../../contracts/ExchangeV2.sol";

contract RaribleTestHelper {
    function encode(LibOrderDataV1.DataV1 memory data)
        external
        pure
        returns (bytes memory)
    {
        return abi.encode(data);
    }

    function encodeV2(LibOrderDataV2.DataV2 memory data)
        external
        pure
        returns (bytes memory)
    {
        return abi.encode(data);
    }

    function encodeV3_SELL(LibOrderDataV3.DataV3_SELL memory data)
        external
        pure
        returns (bytes memory)
    {
        return abi.encode(data);
    }

    function encodeV3_BUY(LibOrderDataV3.DataV3_BUY memory data)
        external
        pure
        returns (bytes memory)
    {
        return abi.encode(data);
    }

    function encodeOriginFeeIntoUint(address account, uint96 value)
        external
        pure
        returns (uint256)
    {
        return (uint256(value) << 160) + uint256(account);
    }

    function hashKey(LibOrder.Order calldata order)
        external
        pure
        returns (bytes32)
    {
        return LibOrder.hashKey(order);
    }

    function hashV2(
        address maker,
        LibAsset.Asset memory makeAsset,
        LibAsset.Asset memory takeAsset,
        uint256 salt,
        bytes memory data
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    maker,
                    LibAsset.hash(makeAsset.assetType),
                    LibAsset.hash(takeAsset.assetType),
                    salt,
                    data
                )
            );
    }
}
