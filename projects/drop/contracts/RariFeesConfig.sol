// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract RariFeesConfig is Ownable {
    address private _recipient;
    mapping (address => uint) private _fee;

    event RecipientSet(address recipient);
    event FeeSet(address currency, uint fee);

    constructor(address owner) {
        if (owner != address(0)) {
            _transferOwnership(owner);
        }
    }

    function setRecipient(address recipient) external onlyOwner {
        _recipient = recipient;
        emit RecipientSet(recipient);
    }

    function setFee(address currency, uint fee) external onlyOwner {
        _fee[currency] = fee;
        emit FeeSet(currency, fee);
    }

    function getFee(address currency) external view returns (uint) {
        return _fee[currency];
    }

    function getRecipient() external view returns (address) {
        return _recipient;
    }
}
