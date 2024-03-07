// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "@thirdweb-dev/contracts/prebuilts/drop/DropERC721.sol";

contract MDNT is DropERC721 {
    function mint(address to, uint256 amount) external payable onlyRole(minterRole) {
        ClaimCondition memory currentClaimPhase = claimCondition.conditions[getActiveClaimConditionId()];
        AllowlistProof memory proof;
        claim(to, amount, currentClaimPhase.currency, currentClaimPhase.pricePerToken, proof, "");
    }
}
