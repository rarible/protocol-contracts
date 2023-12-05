// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";

contract OwnershipTransferAction {
    function perform(address target, address newOwner) public payable {
        Ownable(target).transferOwnership(newOwner);
    }
}
