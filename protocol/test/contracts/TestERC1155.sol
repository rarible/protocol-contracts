// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

contract TestERC1155 is ERC1155Upgradeable, PausableUpgradeable {
    function initialize() external initializer {
        __ERC1155_init("uri");
        __Pausable_init();
    }

    function mint(address to, uint tokenId, uint amount) external {
        _mint(to, tokenId, amount, "");
    }

    function batchSafeTransferFrom(
        address[] memory froms,
        address[] memory tos,
        uint256[] memory ids,
        uint256[] memory amounts
    ) external {
        require(froms.length == tos.length, "wrong length 1");
        require(tos.length == ids.length, "wrong length 2");
        require(ids.length == amounts.length, "wrong length 3");
        for (uint i = 0; i < froms.length; i++) {
            safeTransferFrom(froms[i], tos[i], ids[i], amounts[i], "");
        }
    }

    function emitPauseEvent(bool paused) external {
        if (paused) {
            emit Paused(_msgSender());
        } else {
            emit Unpaused(_msgSender());
        }
    }
}
