// SPDX-License-Identifier: AGPL-3.0
pragma solidity 0.8.23;

import {CREATE3} from "./solmate/utils/CREATE3.sol";

import {ICREATE3Factory} from "./ICREATE3Factory.sol";

/// @title Factory for deploying contracts to deterministic addresses via CREATE3
/// @author zefram.eth
/// @notice Enables deploying contracts using CREATE3. Each deployer (msg.sender) has
/// its own namespace for deployed addresses.
contract CREATE3Factory is ICREATE3Factory {
    /// @inheritdoc	ICREATE3Factory
    function deploy(bytes32 salt, bytes memory creationCode)
        external
        payable
        override
        returns (address deployed)
    {
        // hash salt with the deployer address to give each deployer its own namespace
        salt = keccak256(abi.encodePacked(msg.sender, salt));
        return CREATE3.deploy(salt, creationCode, msg.value);
    }

    /// @inheritdoc	ICREATE3Factory
    function getDeployed(address deployer, bytes32 salt)
        external
        view
        override
        returns (address deployed)
    {
        // hash salt with the deployer address to give each deployer its own namespace
        salt = keccak256(abi.encodePacked(deployer, salt));
        return CREATE3.getDeployed(salt);
    }
}