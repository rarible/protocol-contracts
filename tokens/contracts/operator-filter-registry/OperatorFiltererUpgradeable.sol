// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import {IOperatorFilterRegistry} from "./IOperatorFilterRegistry.sol";

import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";

/**
 * @title  OperatorFiltererUpgradeable
 * @notice Abstract contract whose constructor automatically registers and optionally subscribes to or copies another
 *         registrant's entries in the OperatorFilterRegistry.
 * @dev    This smart contract is meant to be inherited by token contracts so they can use the following:
 *         - `onlyAllowedOperator` modifier for `transferFrom` and `safeTransferFrom` methods.
 *         - `onlyAllowedOperatorApproval` modifier for `approve` and `setApprovalForAll` methods.
 *         Please note that if your token contract does not provide an owner with EIP-173, it must provide
 *         administration methods on the contract itself to interact with the registry otherwise the subscription
 *         will be locked to the options set during construction.
 *
 */

abstract contract OperatorFiltererUpgradeable {
    using AddressUpgradeable for address;

    //canonical OFR rarible address
    address constant CANONICAL_OPERATOR_FILTER_REGISTRY_ADDRESS = 0xD76f01aF5F73563C103A11AB2f52099833D0252C;

    function OPERATOR_FILTER_REGISTRY() public view virtual returns(address) {
        return CANONICAL_OPERATOR_FILTER_REGISTRY_ADDRESS;
    }

    /// @dev no initialiser modifier because it's going to be called inside big init function with such a modifier
    function __OperatorFilterer_init_unchained(address subscribeTo) internal {
        // If an inheriting token contract is deployed to a network without the registry deployed, the modifier
        // will not revert, but the contract will need to be registered with the registry once it is deployed in
        // order for the modifier to filter addresses.
        if (OPERATOR_FILTER_REGISTRY().isContract() && subscribeTo != address(0)) {
            IOperatorFilterRegistry(OPERATOR_FILTER_REGISTRY()).registerAndSubscribe(address(this), subscribeTo);
        }
    }

    /**
     * @dev A helper function to check if an operator is allowed.
     */
    modifier onlyAllowedOperator(address from) virtual {
        // Allow spending tokens from addresses with balance
        // Note that this still allows listings and marketplaces with escrow to transfer tokens if transferred
        // from an EOA.
        if (from != msg.sender) {
            _checkFilterOperator(msg.sender);
        }
        _;
    }

    /**
     * @dev A helper function to check if an operator approval is allowed.
     */
    modifier onlyAllowedOperatorApproval(address operator) virtual {
        _checkFilterOperator(operator);
        _;
    }

    /**
     * @dev A helper function to check if an operator is allowed.
     */
    function _checkFilterOperator(address operator) internal view virtual {
        // Check registry code length to facilitate testing in environments without a deployed registry.
        if (OPERATOR_FILTER_REGISTRY().isContract()) {
            // under normal circumstances, this function will revert rather than return false, but inheriting contracts
            // may specify their own OperatorFilterRegistry implementations, which may behave differently
            require(IOperatorFilterRegistry(OPERATOR_FILTER_REGISTRY()).isOperatorAllowed(address(this), operator), "OperatorNotAllowed");
        }
    }
}
