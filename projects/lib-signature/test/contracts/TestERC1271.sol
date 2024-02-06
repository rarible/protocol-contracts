// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

import "../../contracts/ERC1271.sol";

contract TestERC1271 is ERC1271 {

    bool private returnSuccessfulValidSignature;

    function setReturnSuccessfulValidSignature(bool value) public {
        returnSuccessfulValidSignature = value;
    }

    function isValidSignature(bytes32 _hash, bytes memory _signature) public override view returns (bytes4) {
        return returnSuccessfulValidSignature ? ERC1271_RETURN_VALID_SIGNATURE : ERC1271_RETURN_INVALID_SIGNATURE;
    }
}