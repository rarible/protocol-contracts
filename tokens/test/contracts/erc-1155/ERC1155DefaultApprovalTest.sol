// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

import "../../../contracts/erc-1155/ERC1155DefaultApproval.sol";

contract ERC1155DefaultApprovalTest is ERC1155DefaultApproval {
    function __ERC1155DefaultApprovalTest_init(string memory uri_) external initializer {
        __ERC165_init_unchained();
        __Context_init_unchained();
        __ERC1155_init_unchained(uri_);
    }

    function mint(address to, uint id, uint amount) external {
        _mint(to, id, amount, "");
    }

    function setDefaultApproval(address operator, bool hasApproval) external {
        super._setDefaultApproval(operator, hasApproval);
    }
}
