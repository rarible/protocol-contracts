// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma abicoder v2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./IStaking.sol";
import "./LibStakingMath.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";

contract RariMine is Ownable {
    using SafeMathUpgradeable for uint256;

    event BalanceChange(address indexed owner, uint256 balance);
    event SlopePeriodChange(uint newSlopePeriod);
    event CliffPeriodChange(uint newCliffPeriod);

    struct Balance {
        address recipient;
        uint256 value;
    }

    ERC20 public token;
    address public tokenOwner;
    IStaking public staking;
    mapping(address => uint256) public balances;
    uint public slopePeriod;
    uint public cliffPeriod;

    constructor(ERC20 _token, address _tokenOwner, IStaking _staking) {
        token = _token;
        tokenOwner = _tokenOwner;
        staking = _staking;
    }

    function claim() external {
        uint256 balance = balances[_msgSender()];
        require(balance > 0, "balance <= 0");
        balances[_msgSender()] = 0;
        uint slope = balance;
        if (slopePeriod == 0){
            if (cliffPeriod == 0){
                require(
                token.transferFrom(tokenOwner, msg.sender, balance),
                "transfer token error"
                );
                return;
            }
        } else{
            slope = LibStakingMath.divUp(balance, slopePeriod);
        }

        require(
            token.transferFrom(tokenOwner, address(this), balance),
            "transfer is not successful"
        );
        token.approve(address(staking), balance);
        staking.stake(_msgSender(), _msgSender(), balance, slope, cliffPeriod);
        token.approve(address(staking), 0);
        emit BalanceChange(_msgSender(), 0);
    }

    function plus(Balance[] memory _balances) public onlyOwner {
        for (uint256 i = 0; i < _balances.length; i++) {
            address recipient = _balances[i].recipient;
            uint256 value = _balances[i].value;
            require(recipient != address(0x0), "Recipient should be present");
            require(value != 0, "value should be positive");
            balances[recipient] = balances[recipient].add(_balances[i].value);
            emit BalanceChange(recipient, balances[recipient]);
        }
    }

    function minus(Balance[] memory _balances) public onlyOwner {
        for (uint256 i = 0; i < _balances.length; i++) {
            address recipient = _balances[i].recipient;
            uint256 value = _balances[i].value;
            require(recipient != address(0x0), "Recipient should be present");
            require(value != 0, "value should be positive");
            if (balances[recipient] > _balances[i].value) {
                balances[recipient] = balances[recipient] - _balances[i].value;
            } else {
                balances[recipient] = 0;
            }
            emit BalanceChange(recipient, balances[recipient]);
        }
    }

    function setSlopePeriod(uint _slopePeriod) external onlyOwner {
        slopePeriod = _slopePeriod;
        emit SlopePeriodChange(_slopePeriod);
    }

    function setCliffPeriod(uint _cliffPeriod) external onlyOwner {
        cliffPeriod = _cliffPeriod;
        emit CliffPeriodChange(_cliffPeriod);
    }
}