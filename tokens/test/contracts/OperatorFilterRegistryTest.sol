// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;

import {IOperatorFilterRegistry} from "../../contracts/operator-filter-registry/IOperatorFilterRegistry.sol";

contract OperatorFilterRegistryTest is  IOperatorFilterRegistry {
    mapping(address => address) public _registrations;
    mapping(address => address) public _filteredOperators;

    /**
     * @notice Returns true if operator is not filtered for a given token, either by address or codeHash. Also returns
     *         true if supplied registrant address is not registered.
     */
    function isOperatorAllowed(address registrant, address operator) external view override returns (bool) {
        return (_filteredOperators[_registrations[registrant]] == operator ? false : true);
    }

    /**
     * @notice Registers an address with the registry and "subscribes" to another address's filtered operators and codeHashes.
     */
    function registerAndSubscribe(address registrant, address subscription) external override {
        _registrations[registrant] = subscription;
    }

    /**
     * @notice Registers an address with the registry. May be called by address itself or by EIP-173 owner.
     */
    function register(address registrant) external override {
        _registrations[registrant] = registrant;
    }

    /**
     * @notice Update an operator address for a registered address - when filtered is true, the operator is filtered.
     */
    function updateOperator(address registrant, address operator, bool filtered) external override {
        address operatorToSet = (filtered) ? operator : address(0);
        _filteredOperators[registrant] = operatorToSet;
    }

    function registerAndCopyEntries(address registrant, address registrantToCopy) external override {}
    function unregister(address addr) external override {}
    function updateOperators(address registrant, address[] calldata operators, bool filtered) external override {}
    function updateCodeHash(address registrant, bytes32 codehash, bool filtered) external override {}
    function updateCodeHashes(address registrant, bytes32[] calldata codeHashes, bool filtered) external override {}
    function subscribe(address registrant, address registrantToSubscribe) external override {}
    function unsubscribe(address registrant, bool copyExistingEntries) external override {}
    function subscriptionOf(address addr) external override returns (address registrant) {}
    function subscribers(address registrant) external override returns (address[] memory) {}
    function subscriberAt(address registrant, uint256 index) external override returns (address) {}
    function copyEntriesOf(address registrant, address registrantToCopy) external override {}
    function isOperatorFiltered(address registrant, address operator) external override returns (bool) {}
    function isCodeHashOfFiltered(address registrant, address operatorWithCode) external override returns (bool) {}
    function isCodeHashFiltered(address registrant, bytes32 codeHash) external override returns (bool) {}
    function filteredOperators(address addr) external override returns (address[] memory) {}
    function filteredCodeHashes(address addr) external override returns (bytes32[] memory) {}
    function filteredOperatorAt(address registrant, uint256 index) external override returns (address) {}
    function filteredCodeHashAt(address registrant, uint256 index) external override returns (bytes32) {}
    function isRegistered(address addr) external override returns (bool) {}
    function codeHashOf(address addr) external override returns (bytes32) {}
}
