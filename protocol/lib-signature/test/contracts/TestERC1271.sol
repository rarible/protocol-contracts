// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "../../contracts/ERC1271.sol";

/**
 * @title TestERC1271
 * @dev Test contract for the ERC1271 standard
 * @author iflelsedeveloper (https://github.com/iflelsedeveloper)
 */
contract TestERC1271 is ERC1271 {

    bool private returnSuccessfulValidSignature;

    /**
     * @dev Sets the return value for the isValidSignature function
     * @param value The return value for the isValidSignature function
     */
    function setReturnSuccessfulValidSignature(bool value) public {
        returnSuccessfulValidSignature = value;
    }

    /**
     * @dev Returns the magic number for the isValidSignature function
     * @return The return value for the isValidSignature function
     */
    function isValidSignature(bytes32, bytes memory) public override view returns (bytes4) {
        return returnSuccessfulValidSignature ? ERC1271_RETURN_VALID_SIGNATURE : ERC1271_RETURN_INVALID_SIGNATURE;
    }
}