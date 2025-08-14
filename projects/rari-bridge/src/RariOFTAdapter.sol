// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { OFTAdapter } from "@layerzerolabs/oft-evm/contracts/OFTAdapter.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract RariOFTAdapter is OFTAdapter {
    constructor(
        address _token,
        address _layerZeroEndpoint,
        address _delegate
    ) OFTAdapter(_token, _layerZeroEndpoint, _delegate) Ownable(_delegate) {}
}
