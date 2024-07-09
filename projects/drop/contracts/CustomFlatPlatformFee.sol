// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

/// @author thirdweb

import "@thirdweb-dev/contracts/extension/interface/IPlatformFee.sol";

/**
 *  @title   Platform Fee
 *  @notice  Thirdweb's `PlatformFee` is a contract extension to be used with any base contract. It exposes functions for setting and reading
 *           the recipient of platform fee and the platform fee basis points, and lets the inheriting contract perform conditional logic
 *           that uses information about platform fees, if desired.
 */

abstract contract CustomFlatPlatformFee is IPlatformFee {
    /// @dev The sender is not authorized to perform the action
    error PlatformFeeUnauthorized();

    /// @dev Indicates that only flat platform fee is supported
    error PlatformFeeNotSupported();

    /// @dev The recipient is invalid
    error PlatformFeeInvalidRecipient(address recipient);

    /// @dev The address that receives all platform fees from all sales.
    address private platformFeeRecipient;

    /// @dev The flat amount collected by the contract as fees on primary sales.
    uint256 private flatPlatformFee;

    /// @dev Returns the platform fee recipient and bps.
    function getPlatformFeeInfo() public pure override returns (address, uint16) {
        return (address(0), 0);
    }

    /// @dev Returns the platform fee bps and recipient.
    function getFlatPlatformFeeInfo() public view returns (address, uint256) {
        return (platformFeeRecipient, flatPlatformFee);
    }

    /// @dev Returns the platform fee type.
    function getPlatformFeeType() public pure returns (PlatformFeeType) {
        return PlatformFeeType.Flat;
    }

    /// @notice Lets a module admin set a flat fee on primary sales.
    function setFlatPlatformFeeInfo(address _platformFeeRecipient, uint256 _flatFee) external {
        if (!_canSetPlatformFeeInfo()) {
            revert PlatformFeeUnauthorized();
        }

        _setupFlatPlatformFeeInfo(_platformFeeRecipient, _flatFee);
    }

    /// @dev Sets a flat fee on primary sales.
    function _setupFlatPlatformFeeInfo(address _platformFeeRecipient, uint256 _flatFee) internal {
        flatPlatformFee = _flatFee;
        platformFeeRecipient = _platformFeeRecipient;

        emit FlatPlatformFeeUpdated(_platformFeeRecipient, _flatFee);
    }    

    /**
     *  @notice         Updates the platform fee recipient and bps.
     *  @dev            Always reverts with PlatformFeeNotSupported
     */
    function setPlatformFeeInfo(address, uint256) external pure override {
        revert PlatformFeeNotSupported();
    }


    function _canSetPlatformFeeInfo() internal view virtual returns (bool);
}
