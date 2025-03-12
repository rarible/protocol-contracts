// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;

import "./IPrngSystemContract.sol";

contract PrngSystemContract {
    event PseudoRandomSeed(bytes32 seedBytes);

    // Prng system contract address with ContractID 0.0.361
    address constant PRECOMPILE_ADDRESS = address(0x169);

    function getPseudorandomSeed() external returns (bytes32 seedBytes) {
        (bool success, bytes memory result) = PRECOMPILE_ADDRESS.call(
            abi.encodeWithSelector(IPrngSystemContract.getPseudorandomSeed.selector));
        require(success, "PRNG system call failed");
        seedBytes = abi.decode(result, (bytes32));
        emit PseudoRandomSeed(seedBytes);
    }
}
