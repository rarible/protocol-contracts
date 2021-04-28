// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@rarible/lib-broken-line/contracts/LibBrokenLine.sol";

/**
  * balanceOf(address account) - текущий баланс (сумма всех локов) юзера
  * totalSupply() - общий баланс всех юзеров
  * createLock(uint value, uint slope, uint cliff) - сколько залочим, со скоростью разлока, сколько cliff длиной
  **/

contract Staking {
    using SafeMathUpgradeable for uint;
    using LibBrokenLine for BrokenLineDomain.BrokenLine;

    uint256 constant WEEK = 604800;                 //seconds one week
    uint256 constant STARTING_POINT_WEEK = 2676;    //starting point week (Staking Epoch begining)
    ERC20Upgradeable public token;

    struct Lock {
        uint dt;        //deposit time, period
        uint amount;    //amount deposited, num ERC20
        uint et;        //end time, timestamp in WEEKs
        uint cliff;     //cliff - period when slope = 0
    }

    struct Locks {
        mapping (uint => Lock) userLocks;   //idLock - Lock (end time)
        uint balance;                       //user Balanse in erc20
    }

    mapping(address => BrokenLineDomain.BrokenLine) public userBalances;    //address - line
    BrokenLineDomain.BrokenLine public totalBalances;                       //total User Balance
    mapping (address => Locks) locks;                                       //address User - Lock
    Locks public totalLocks;
    uint public idLock;

    constructor(ERC20Upgradeable _token) public {
        token = _token;
        idLock = 1;
    }

    function createLock(address account, uint amount, uint slope, uint cliff) public returns (uint) {
        //todo проверки
        uint blockTime = roundTimestamp(block.timestamp);
        uint period = amount/slope;
        BrokenLineDomain.Line memory line = BrokenLineDomain.Line(blockTime, amount, slope);
        idLock++;
        userBalances[account].add(line, cliff);
        totalBalances.add(line, cliff);
        locks[account].userLocks[idLock] = Lock(blockTime, amount, blockTime + period, cliff);
        totalLocks.userLocks[idLock] = Lock(blockTime, amount, blockTime + period, cliff);
        locks[account].balance += amount;
        totalLocks.balance += amount;
        require(token.transferFrom(account, address(this), amount), "failure while transferring");
        return idLock;

        // как меняется lock общий, когда юзер приходит/уходит/меняет
        // 1. нужно применить пропущенные изменения (окончания локов)
        // 2. если добавляем, то
    }

    /*
    * сколько залочено всего
    */
    function totalSupply() public returns (uint) {
        if (totalBalances.initial.start == 0) { //no lock
            return 0;
        }
        totalBalances.update(roundTimestamp(block.timestamp));
        return totalBalances.initial.bias;
    }

    /*
	* сколько залочено у одного User
	*/
    function userSypply(address account) public returns (uint) {
        if (userBalances[account].initial.start == 0) { //no lock
            return 0;
        }
        userBalances[account].update(roundTimestamp(block.timestamp));
        return userBalances[account].initial.bias;
    }

    /*
    * сколько мы можем одному User перечислить ERC20 обратно
    */
    function userWithdrawSupply(address account) public returns(uint) {
        userBalances[account].update(roundTimestamp(block.timestamp));
        return locks[account].balance - userBalances[account].initial.bias;
    }

    /*
    * сколько мы можем всем перечислить ERC20 обратно
    */
    function totalWithdrawSupply(address account) public returns(uint) {
        totalBalances.update(roundTimestamp(block.timestamp));
        return totalLocks.balance - totalBalances.initial.bias;
    }

    /*
    * одному User перечислить ERC20 обратно
    */
    function userWithdraw(address account) public  {
        uint value = userWithdrawSupply(account);
        if (value > 0) {
            locks[account].balance -= value;
            totalLocks.balance -= value;
            require(token.transferFrom(address(this), account, value), "failure while transferring");
        }
        //todo Lock delete
    }


    function increaseUnlockTime(uint lockId, uint period) public {

    }

    function increaseLockedValue(uint lockId, uint period) public {

    }


    function roundTimestamp(uint ts) pure internal returns (uint) {
        return ts.div(WEEK).sub(STARTING_POINT_WEEK);
    }

}

