// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./LibSecondarySaleFeesV2.sol";

interface SecondarySaleFeesV2 {
    event SecondarySaleFees(uint256 tokenId, address[] recipients, uint[] bps);

    function getFees(uint256 id) external view returns (LibSecondarySaleFeesV2.Fee[] memory);
}
