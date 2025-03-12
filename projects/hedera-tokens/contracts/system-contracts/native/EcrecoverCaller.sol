// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;

contract EcrecoverCaller {
    event EcrecoverResult(bytes result);
    address accountZeroZeroOne = address(0x0000000000000000000000000000000000000001);

    function callEcrecover(bytes32 messageHash, uint8 v, bytes32 r, bytes32 s) external pure returns (address) {
        address result = ecrecover(messageHash, v, r, s);
        return result;
    }

    function call0x1(bytes calldata callData) external payable returns (bool) {
        address target = accountZeroZeroOne;
        (bool success, bytes memory result) = target.call{value: msg.value}(callData);
        if (!success) {
            revert();
        }
        emit EcrecoverResult(result);
        return success;
    }

    function send0x1() external payable {
        address payable target = payable(accountZeroZeroOne);
        target.transfer(msg.value);
    }

    function transfer0x1() external payable {
        address payable target = payable(accountZeroZeroOne);
        target.transfer(msg.value);
    }
}
