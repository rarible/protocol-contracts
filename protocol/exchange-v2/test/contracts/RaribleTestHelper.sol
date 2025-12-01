// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
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

    function encodeV3(LibOrderDataV3.DataV3 memory data)
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

    function encodeLazy721(LibERC721LazyMint.Mint721Data memory data, address token)
        external
        pure
        returns (bytes memory)
    {
        return abi.encode(token, data);
    }

    function encodeLazy1155(LibERC1155LazyMint.Mint1155Data memory data, address token)
        external
        pure
        returns (bytes memory)
    {
        return abi.encode(token, data);
    }

}
