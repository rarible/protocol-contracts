// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract EthNativePrecompileCaller {
    event PrecompileResult(bytes result);
    event PrecompileResult32(bytes32 result);
    event PrecompileResultUint(uint result);

    function call0x01(bytes calldata callData) external returns (bool) {
        (bool calculated, bytes memory result) = address(1).call(callData);
        
        require(calculated, "Error calling precompile 0x01");
        emit PrecompileResult(result);
        
        return calculated;
    }

    function call0x02(string memory input) external returns (bool) {
        (bool calculated, bytes memory result) = address(2).staticcall(bytes(input));
		
		require(calculated, "Error calling precompile 0x02");
        bytes32 h = abi.decode(result, (bytes32));
        emit PrecompileResult32(h);

        return calculated;
    }

    function call0x02sha256(string memory input) external pure returns (bytes32) {
        bytes32 hashRes = sha256(bytes(input));

        return hashRes;
    }

    function call0x03(string calldata input) external returns (bool) {
        (bool calculated, bytes memory result) = address(3).staticcall(bytes(input));
		
		require(calculated, "Error calling precompile 0x03");
        bytes32 h = abi.decode(result, (bytes32));
        emit PrecompileResult32(h);

        return calculated;
    }

    function call0x04(string calldata data) external returns (bool) {
        (bool calculated, bytes memory result) = address(4).staticcall(bytes(data));

        require(calculated, "Error calling precompile 0x04");
        emit PrecompileResult(result);
        emit PrecompileResult(bytes(data));

        return calculated;
    }

    function call0x05(uint64 base, uint64 exp, uint64 modulus) external returns (bytes memory) {
        bytes memory fixed32BytesCalldata = abi.encode(
            abi.encodePacked(base).length,
            abi.encodePacked(exp).length,
            abi.encodePacked(modulus).length
        );
        bytes memory dynamicCallData = abi.encodePacked(
            base,
            exp,
            modulus
        );
        bytes memory callData = abi.encodePacked(fixed32BytesCalldata, dynamicCallData);

        (bool success, bytes memory result) = address(5).call(callData);
        require(success, "Error calling precompile 0x05");

        return result;
    }

    function call0x06(bytes calldata callData) external returns (bool) {
        (bool calculated, bytes memory result) = address(6).staticcall(callData);

        require(calculated, "Error calling precompile 0x06");
        (bytes32 x, bytes32 y) = abi.decode(result, (bytes32, bytes32));
        emit PrecompileResult32(x);
        emit PrecompileResult32(y);
        
        return calculated;
    }

    function call0x07(bytes calldata callData) external returns (bool) {
        (bool calculated, bytes memory result) = address(7).staticcall(callData);

        require(calculated, "Error calling precompile 0x07");
        (bytes32 x, bytes32 y) = abi.decode(result, (bytes32, bytes32));
        emit PrecompileResult32(x);
        emit PrecompileResult32(y);
        
        return calculated;
    }

    function call0x08(bytes calldata callData) external returns (bool) {
        (bool calculated, bytes memory result) = address(8).staticcall(callData);

        require(calculated, "Error calling precompile 0x08");
        (bytes32 success) = abi.decode(result, (bytes32));
        emit PrecompileResult32(success);
        
        return calculated;
    }

    function call0x09(bytes calldata callData) external returns (bool) {
        (bool calculated, bytes memory result) = address(9).staticcall(callData);

        require(calculated, "Error calling precompile 0x09");
        emit PrecompileResult(result);
        
        return calculated;
    }
}
