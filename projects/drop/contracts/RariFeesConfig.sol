// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract RariFeesConfig is Ownable {
    address private _recipient;
    mapping (address => uint) private _fee;

    event RecipientSet(address recipient);
    event FeeSet(address token, uint fee);

    constructor(address owner) public {
        if (owner != address(0)) {
            _transferOwnership(owner);
        }
    }

    function setRecipient(address recipient) external onlyOwner {
        _recipient = recipient;
        emit RecipientSet(recipient);
    }

    function setFee(address token, uint fee) external onlyOwner {
        _fee[token] = fee;
        emit FeeSet(token, fee);
    }

    function getFee(address token) external view returns (uint) {
        return _fee[token];
    }

    function getRecipient() external view returns (address) {
        return _recipient;
    }
}
