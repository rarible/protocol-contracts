// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@rarible/royalties/contracts/LibPart.sol";

abstract contract AbstractRoyaltiesRegistry {
    mapping(address => LibPart.Part[]) public royaltiesByToken;
}
