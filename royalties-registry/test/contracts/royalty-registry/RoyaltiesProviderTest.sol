// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;


import "@rarible/royalties/contracts/IRoyaltiesProvider.sol";
import "@rarible/royalties/contracts/LibPart.sol";

contract RoyaltiesProviderTest is IRoyaltiesProvider {

    mapping (address => LibPart.Part[]) internal royaltiesTest;

    function initializeProvider(address token, LibPart.Part[] memory royalties) public {
        for (uint256 i = 0; i < royalties.length; i++) {
            royaltiesTest[token].push(royalties[i]);
        }
    }

    function getRoyalties(address token, uint) override external view returns(LibPart.Part[] memory) {
        return royaltiesTest[token];
    }
}
