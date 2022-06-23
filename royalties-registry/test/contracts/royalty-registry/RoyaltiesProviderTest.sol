// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;


import "@rarible/exchange-interfaces/contracts/IRoyaltiesProvider.sol";
import "@rarible/lib-part/contracts/LibPart.sol";

contract RoyaltiesProviderTest is IRoyaltiesProvider {

    mapping (address => mapping(uint => LibPart.Part[])) internal royaltiesTest;

    function initializeProvider(address token, uint tokenId, LibPart.Part[] memory royalties) public {
        delete royaltiesTest[token][tokenId];
        for (uint256 i = 0; i < royalties.length; i++) {
            royaltiesTest[token][tokenId].push(royalties[i]);
        }
    }

    function getRoyalties(address token, uint tokenId) override external view returns(LibPart.Part[] memory) {
        return royaltiesTest[token][tokenId];
    }
}
