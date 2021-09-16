// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/proxy/Initializable.sol";

contract NoMetaTxTest is Initializable {
    string public  name;
    string public  version;
//    event TestNoMetaTxTest(uint result);

    function __NoMetaTxTest_init(string memory _name, string memory _version) external initializer {
        name = _name;
        version = _version;
    }

//    function sum(uint a, uint b) external {
//        emit TestNoMetaTxTest(a + b);
//    }

}
