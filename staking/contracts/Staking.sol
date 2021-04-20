// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "../lib/LibBrokenLine.sol";
/**
  * balanceOf(address account) - текущий баланс (сумма всех локов) юзера
  * totalSupply() - общий баланс всех юзеров
  * createLock(uint value, uint period, uint cliff) - сколько залочим, на какой срок, сколько cliff длиной
  **/

contract Staking {
    uint256 constant WEEK = 86400 * 7;

    struct Lock {
        uint dt;    //deposit time
        uint amount;//amount deposited
        uint et;    //end time
        uint cliff; //time freeze amount
    }

    mapping(address => Lock) public locks;
    mapping(uint => BrokenLineDomain.BrokenLine) public userBalances; //uint - idLock
    BrokenLineDomain.BrokenLine public protocolBalances;
    uint public idLock;

    constructor() public { //todo сделать, чтобы вызывался единожды!!!
        idLock = 1;
        //todo initialize protocolBalances
    }

    function createLock(address account, uint amount, uint period, uint cliff) internal returns (uint) {
        //todo проверки
        Lock memory lock = locks[account];
        uint blockTime = roundTimestamp(block.timestamp);
        BrokenLineDomain.Line memory line = lockToLine(Lock(blockTime, amount, period, cliff));
        if (lock.dt == 0) {         //no lock at all, add new lock
            locks[account] = Lock(blockTime, amount, period, cliff);
        } else {
            require(blockTime < lock.et, "lock expired");
            locks[account] = Lock(blockTime, amount, period, cliff);
        }
        idLock++;
        LibBrokenLine.add(userBalances[idLock], line);
        LibBrokenLine.add(protocolBalances, line);
        return idLock;

        // как меняется lock общий, когда юзер приходит/уходит/меняет
        // 1. нужно применить пропущенные изменения (окончания локов)
        // 2. если добавляем, то
    }

    function balanceOf(address account) public view returns (uint) {
        Lock memory lock = locks[account];
        if (lock.dt == 0) { //no lock
            return 0;
        }
        return balanceOf(lockToLine(lock), roundTimestamp(block.timestamp));
    }

    function balanceOf(BrokenLineDomain.Line memory line, uint time) pure internal returns (uint) {
        //change of bias
        uint change = line.slope * (time - line.start);
        if (change >= line.bias) {// lock expired
            return 0;
        } else {
            return line.bias - change;
        }
    }

    function _increaseUnlockTime(address account, uint newUnlockTime) internal {

    }

    function _withdraw() internal {

    }

    function lockToLine(Lock memory lock) internal pure returns (BrokenLineDomain.Line memory) {
        require(lock.dt != 0, "lock is not defined");
        return BrokenLineDomain.Line(lock.dt, lock.amount, lock.amount / (lock.et - lock.dt));
    }

    function roundTimestamp(uint ts) pure internal returns (uint) {
        return ts / WEEK;
    }

}

