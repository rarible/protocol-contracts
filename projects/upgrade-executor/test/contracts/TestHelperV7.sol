// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "../../src/actions/UpdateAddressAction.sol";

/**
 * @notice this contract was added to perform encoding on v0.7 contracts
 **/
contract TestHelperV7 {
    function encodeAddressUpdateCall(
        address target,
        RaribleExchangeWrapperUpgradeable.Markets market,
        address newAddress
    ) external pure returns (bytes memory) {
        return abi.encodeWithSelector(UpdateAddressAction.perform.selector, target, market, newAddress);
    }
}
