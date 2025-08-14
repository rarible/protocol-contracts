// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {OFT} from "@layerzerolabs/oft-evm/contracts/OFT.sol";

contract RariOFT is OFT {
    constructor(address _layerZeroEndpoint, address _delegate) OFT("Rarible Token", "RARI", _layerZeroEndpoint, _delegate) Ownable(_delegate) {}
}
