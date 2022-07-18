// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.9.0;
pragma abicoder v2;

import "@rarible/lib-part/contracts/LibPart.sol";

interface IRoyaltiesProvider {
    function getRoyalties(address token, uint tokenId) external returns (LibPart.Part[] memory);
}
