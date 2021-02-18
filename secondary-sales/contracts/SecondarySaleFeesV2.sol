// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./LibFee.sol";

interface SecondarySaleFeesV2 {
    event SecondarySaleFees(uint256 tokenId, LibFee.Fee[] fees);

    function getFees(uint256 id) external view returns (LibFee.Fee[] memory);
}
