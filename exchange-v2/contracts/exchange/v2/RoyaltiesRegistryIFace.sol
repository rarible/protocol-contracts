// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@rarible/royalties/contracts/LibPart.sol";

interface RoyaltiesRegistryIFace {
    function getRoyalties(
        address token,
        uint tokenId
    ) external view returns (LibPart.Part[] memory);
}
