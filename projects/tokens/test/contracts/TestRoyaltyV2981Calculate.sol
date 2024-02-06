// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;
pragma abicoder v2;

import "../../contracts/erc-721/ERC721Base.sol";

contract TestRoyaltyV2981Calculate is ERC721Base {
    function calculateRoyaltiesTest(address to, uint256 amount) external view returns (LibPart.Part[] memory) {
        return LibRoyalties2981.calculateRoyalties(to, amount);
    }
}
