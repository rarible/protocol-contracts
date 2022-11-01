// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma abicoder v2;

contract LibEncoderTest {

    struct Balance {
        address recipient;
        uint256 value;
    }

    function encodeAbi(Balance memory _balance, address _address, uint8 _version) external pure returns (bytes memory) {
        uint256 id;
        assembly {
            id := chainid()
        }
        return abi.encode(_balance, _address, _version, id);
    }

    function getKeccak256(bytes memory data) external pure returns (bytes32) {
        return keccak256(data);
    }

    function toString(bytes32 value) public pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(64);
        for (uint256 i = 0; i < 32; ++i) {
            str[i*2] = alphabet[uint8(value[i] >> 4)];
            str[1+i*2] = alphabet[uint8(value[i] & 0x0f)];
        }
        return string(str);
    }

    function prepareMessage(Balance memory _balance, address _address, uint8 _version) external pure returns (string memory) {
        uint256 id;
        assembly {
            id := chainid()
        }
        return toString(keccak256(abi.encode(_balance, _address, _version, id)));
    }

}