// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import {LibClone} from "./lib/solady/src/utils/LibClone.sol";

contract TWCloneFactory {

    error ProxyDeploymentFailed();

    /// Deprecated
    /// @dev Emitted when a proxy is deployed.
    event ProxyDeployed(address indexed implementation, address proxy, address indexed deployer);

    /// @dev Emitted when a proxy is deployed.
    event ProxyDeployedV2(
        address indexed implementation,
        address indexed proxy,
        address indexed deployer,
        bytes32 inputSalt,
        bytes data,
        bytes extraData
    );

    /// Deprecated
    /// @dev Deploys a proxy that points to the given implementation.
    function deployProxyByImplementation(address _implementation, bytes memory _data, bytes32 _salt)
        public
        returns (address deployedProxy)
    {
        bytes32 saltHash = keccak256(abi.encodePacked(msg.sender, _salt));
        deployedProxy = LibClone.cloneDeterministic(_implementation, saltHash);

        emit ProxyDeployed(_implementation, deployedProxy, msg.sender);

        if (_data.length > 0) {
            // slither-disable-next-line unused-return
            (bool success,) = deployedProxy.call(_data);

            if (!success) {
                revert ProxyDeploymentFailed();
            }
        }
    }

    /// @dev Deploys a proxy that points to the given implementation.
    function deployProxyByImplementationV2(
        address implementation,
        bytes memory data,
        bytes32 salt,
        bytes memory extraData
    ) public returns (address deployedProxy) {
        bytes32 saltHash = _guard(salt, data);
        deployedProxy = LibClone.cloneDeterministic(implementation, saltHash);

        emit ProxyDeployedV2(implementation, deployedProxy, msg.sender, salt, data, extraData);

        if (data.length > 0) {
            // slither-disable-next-line unused-return
            (bool success,) = deployedProxy.call(data);

            if (!success) {
                revert ProxyDeploymentFailed();
            }
        }
    }

    function _guard(bytes32 salt, bytes memory data) internal view returns (bytes32) {
        // check bit 0
        bool allowCrossChainDeployment = (salt[0] & bytes1(uint8(1))) != bytes1(0);
        // check bit 1
        bool encodeDataIntoSalt = (salt[0] & bytes1(uint8(2))) != bytes1(0);
        // check bit 2
        bool useMsgSender = (salt[0] & bytes1(uint8(4))) != bytes1(0);

        bytes32 saltHash;
        if (allowCrossChainDeployment && encodeDataIntoSalt) {
            saltHash = keccak256(abi.encode(salt, data));
        } else if (allowCrossChainDeployment && !encodeDataIntoSalt) {
            saltHash = keccak256(abi.encode(salt));
        } else if (!allowCrossChainDeployment && encodeDataIntoSalt) {
            saltHash = keccak256(abi.encode(salt, block.chainid, data));
        } else {
            saltHash = keccak256(abi.encode(salt, block.chainid));
        }

        if(useMsgSender) {
            keccak256(abi.encode(saltHash, msg.sender));
        }

        return saltHash;
    }

}
