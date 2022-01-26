// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

contract MetaTxSaltTest  {

    bytes32 constant CONTRACT_METATX_SALT_HASH = keccak256(
        "MetaTxTest_Salt"
    );

    function getSalt() external view returns(bytes32) {
        return CONTRACT_METATX_SALT_HASH;
    }
}
