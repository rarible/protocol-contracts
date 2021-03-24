// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@rarible/royalties/contracts/LibPart.sol";
import "./LibAsset.sol";

interface RoyaltiesRegistryIFace {
    function getRoyalties(
        address id,
        uint tokenId,
        LibAsset.AssetType memory asset
    ) external view returns (LibPart.Part[] memory);
}
