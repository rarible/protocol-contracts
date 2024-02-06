// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract IsPausable is Ownable {
    bool public paused;

    event Paused(bool paused);

    function pause(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    function requireNotPaused() internal view {
        require (!paused, "the contract is paused");
    }

}
