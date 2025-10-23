// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;


import "@rarible/exchange-interfaces/contracts/IRoyaltiesProvider.sol";
import "@rarible/lib-part/contracts/LibPart.sol";

contract RoyaltiesRegistryTest {

    event getRoyaltiesTest(LibPart.Part[] royalties);

    function _getRoyalties(address royaltiesTest, address token, uint tokenId) external {
        IRoyaltiesProvider withRoyalties = IRoyaltiesProvider(royaltiesTest);
        LibPart.Part[] memory royalties = withRoyalties.getRoyalties(token, tokenId);
        emit getRoyaltiesTest(royalties);
    }
}
