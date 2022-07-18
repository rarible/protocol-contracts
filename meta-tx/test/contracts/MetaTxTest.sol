// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

import "../../contracts/EIP712MetaTransaction.sol";

contract MetaTxTest is EIP712MetaTransaction {

    event SimpleEventSum(uint result);

    function __MetaTxTest_init(string memory _name, string memory _symbol, string memory _version) external initializer {

        __MetaTransaction_init_unchained(_name, _version);
    }

    function sumTest(uint a, uint b) external returns(uint) {
        uint result = a + b;
        emit SimpleEventSum(result);
        return result;
    }

    function mulTest(uint a, uint b) external returns(uint) {
        uint result = a * b;
        return result;
    }

    function _msgSender() internal view virtual override(EIP712MetaTransaction) returns (address payable) {
        return super._msgSender();
    }
}
