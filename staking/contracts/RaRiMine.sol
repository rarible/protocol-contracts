// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "./IStaking.sol";
import "./LibStakingMath.sol";

/**
 * @dev RariMine, a contract that allows to increase (function plus())
 *      or decrease (function minus()) the balance of ERC20 users tokens.
 *      Also user can initiate stake or withdraw his own amount of ERC20 tokens.
 *      In function claim() Withdraw case works only for slopePeriod == cliffPeriod == 0,
 *      else stake`ll be initiate with amount equal ERC20 tokens user balance.
 */
contract RariMine is Ownable {
    using SafeMathUpgradeable for uint256;

    event BalanceChange(address indexed owner, uint256 balance);
    event SlopePeriodChange(uint indexed newSlopePeriod);
    event CliffPeriodChange(uint indexed newCliffPeriod);

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

    /**
     * @dev constructor, initialise necessary contracts needed for work
     * @param _token, ERC20 token address contract
     * @param _tokenOwner, address token owner
     * @param _staking, staking address contract
     */
    constructor(ERC20 _token, address _tokenOwner, IStaking _staking) {
        token = _token;
        tokenOwner = _tokenOwner;
        staking = _staking;
    }

    /**
     * @dev function, allow stake amount ERC20 tokens or
     *      withdraw ERC20 tokens to user if slopePeriod == cliffPeriod == 0
     */
    function claim() external {
        uint256 stakeAmount = balances[_msgSender()];
        require(stakeAmount > 0, "Amount for stake == 0");
        balances[_msgSender()] = 0;
        uint slope = stakeAmount;
        if (slopePeriod == 0) {
            if (cliffPeriod == 0) {
                require(
                    token.transferFrom(tokenOwner, msg.sender, stakeAmount),
                    "Recipient transfer token error"
                );
                emit BalanceChange(_msgSender(), 0);
                return;
            }
        } else {
            slope = LibStakingMath.divUp(stakeAmount, slopePeriod);
        }

        require(
            token.transferFrom(tokenOwner, address(this), stakeAmount),
            "Contract transfer token error"
        );
        token.approve(address(staking), stakeAmount);
        staking.stake(_msgSender(), _msgSender(), stakeAmount, slope, cliffPeriod);
        token.approve(address(staking), 0);
        emit BalanceChange(_msgSender(), 0);
    }

    /**
     * @dev function, add users balances in cycle by contract owner
     * @param _balances, array balances
     */
    function plus(Balance[] memory _balances) external onlyOwner {
        for (uint256 i = 0; i < _balances.length; i++) {
            address recipient = _balances[i].recipient;
            uint256 value = _balances[i].value;
            require(recipient != address(0x0), "Incorrect recipient address");
            require(value != 0, "Incorrect add amount");
            balances[recipient] = balances[recipient].add(_balances[i].value);
            emit BalanceChange(recipient, balances[recipient]);
        }
    }

    /**
     * @dev function, sub users balances in cycle by contract owner
     * @param _balances, array balances
     */
    function minus(Balance[] memory _balances) external onlyOwner {
        for (uint256 i = 0; i < _balances.length; i++) {
            address recipient = _balances[i].recipient;
            uint256 value = _balances[i].value;
            require(recipient != address(0x0), "Incorrect recipient address");
            require(value != 0, "Incorrect sub amount");
            if (balances[recipient] > _balances[i].value) {
                balances[recipient] = balances[recipient] - _balances[i].value;
            } else {
                balances[recipient] = 0;
            }
            emit BalanceChange(recipient, balances[recipient]);
        }
    }

    /**
     * @dev function, set new slopePeriod by contract owner
     * @param _slopePeriod, new value (number of weeks) for slopePeriod
     */
    function setSlopePeriod(uint _slopePeriod) external onlyOwner {
        slopePeriod = _slopePeriod;
        emit SlopePeriodChange(_slopePeriod);
    }

    /**
     * @dev function, set new cliffPeriod by contract owner
     * @param _cliffPeriod, new value (number of weeks) for cliffPeriod
     */
    function setCliffPeriod(uint _cliffPeriod) external onlyOwner {
        cliffPeriod = _cliffPeriod;
        emit CliffPeriodChange(_cliffPeriod);
    }
}