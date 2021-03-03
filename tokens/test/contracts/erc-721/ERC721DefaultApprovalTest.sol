// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

import "../../../contracts/erc-721/ERC721DefaultApproval.sol";

contract ERC721DefaultApprovalTest is ERC721DefaultApproval {
    function __ERC721DefaultApprovalTest_init(string memory name_, string memory symbol_) external initializer {
        __ERC721_init_unchained(name_, symbol_);
        __ERC165_init_unchained();
        __Context_init_unchained();
    }

    function mint(address to, uint tokenId) external {
        _safeMint(to, tokenId);
    }

    function setDefaultApproval(address operator, bool hasApproval) external {
        super._setDefaultApproval(operator, hasApproval);
    }
}
