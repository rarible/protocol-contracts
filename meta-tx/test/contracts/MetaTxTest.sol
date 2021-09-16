// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../../contracts/EIP712MetaTransaction.sol";
import "./SimpleTest.sol";
//import "@rarible/meta-tx/contracts/EIP712MetaTransaction.sol";

contract MetaTxTest is SimpleTest, EIP712MetaTransaction {

    function __MetaTxTest_init(string memory _name, string memory _version) external initializer {
        __MetaTransaction_init_unchained(_name, _version);
    }

//    function _msgSender() internal view virtual override(EIP712MetaTransaction) returns (address payable) {
//        return super._msgSender();
//    }
}
