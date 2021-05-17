// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@rarible/lib-broken-line/contracts/LibBrokenLine.sol";

contract Staking {
    using SafeMathUpgradeable for uint;
    using LibBrokenLine for BrokenLineDomain.BrokenLine;

    uint256 constant WEEK = 604800;                 //seconds one week
    uint256 constant STARTING_POINT_WEEK = 2676;    //starting point week (Staking Epoch begining)
    ERC20Upgradeable public token;
    uint public id;                                 //id Line, successfully added to BrokenLine

    struct Locks {
        BrokenLineDomain.BrokenLine balance;   //line of stRari balance
        BrokenLineDomain.BrokenLine locked;    //locked amount (RARI)
        uint amount;                           //user RARI (lockedAmount+ amountready for transferBack)
    }

    mapping (address => Locks) locks;                   //address User - Lock
    mapping (uint => address) deposits;                 //idLock address User
    BrokenLineDomain.BrokenLine public totalSupplyLine; //total stRARI balance

    constructor(ERC20Upgradeable _token) public {
        token = _token;
    }

    function createLock(address account, uint amount, uint slope, uint cliff) public {
        if (amount == 0) {
            return;
        }
        uint blockTime = roundTimestamp(block.timestamp);
        BrokenLineDomain.Line memory line = BrokenLineDomain.Line(blockTime, getStake(amount, slope, cliff), slope);
        BrokenLineDomain.Line memory lineLocked = BrokenLineDomain.Line(blockTime, amount, slope);

        id++;
        totalSupplyLine.add(line, id, cliff);
        locks[account].balance.add(line, id, cliff);
        locks[account].locked.add(lineLocked, id, cliff);
        deposits[id] = account;
        locks[account].amount = locks[account].amount.add(amount);
        require(token.transferFrom(account, address(this), amount), "failure while transferring");

        // как меняется lock общий, когда юзер приходит/уходит/меняет
        // 1. нужно применить пропущенные изменения (окончания локов)
        // 2. если добавляем, то
    }

    function totalSupply() public returns (uint) {
        if (totalSupplyLine.initial.start == 0) { //no lock
            return 0;
        }
        totalSupplyLine.update(roundTimestamp(block.timestamp));
        return totalSupplyLine.initial.bias;
    }

    function balanceOf(address account) public returns (uint) {
        if (locks[account].balance.initial.start == 0) { //no lock
            return 0;
        }
        locks[account].balance.update(roundTimestamp(block.timestamp));
        return locks[account].balance.initial.bias;
    }

    function withdraw() public  {
        locks[msg.sender].balance.update(roundTimestamp(block.timestamp));
        uint value = locks[msg.sender].amount.sub(locks[msg.sender].balance.initial.bias);
        if (value > 0) {
            locks[msg.sender].amount = locks[msg.sender].amount.sub(value);
            require(token.transfer(msg.sender, value), "failure while transferring");
        }
        //todo Lock delete
    }

    function restake(uint idLock, uint newAmount, uint newSlope, uint newCliff) internal returns (uint newId) {
        address account = deposits[idLock];
        if (account == address(0)){
            return 0;
        }

        uint blockTime = roundTimestamp(block.timestamp);
        withdraw(); //
        if (newAmount > 0){ //if amount, то переведем ERC20 себе
            require(token.transferFrom(deposits[idLock], address(this), newAmount), "failure while transferring");
        }
        /*delete*/
        uint amountEnd = locks[account].locked.remove(idLock, blockTime);   //RARI amount
        locks[account].balance.remove(idLock, blockTime);                   //stRARI
        totalSupplyLine.remove(idLock, blockTime);                          //total stRARI

        amountEnd = amountEnd.add(newAmount);
        BrokenLineDomain.Line memory line = BrokenLineDomain.Line(blockTime, getStake(amountEnd, newSlope, newCliff), newSlope);
        BrokenLineDomain.Line memory lineLocked = BrokenLineDomain.Line(blockTime, amountEnd, newSlope);
        /*add*/
        id++;
        totalSupplyLine.add(line, id, newCliff);
        locks[account].balance.add(line, id, newCliff);
        locks[account].locked.add(lineLocked, id, newCliff);
        deposits[id] = account;
        locks[account].amount = locks[account].amount.add(amountEnd);
    }

    function getStake(uint amount, uint slope, uint cliff) internal returns (uint){
        return amount;
    }

    function increaseUnlockTime(uint lockId, uint period) public {

    }

    function increaseLockedValue(uint lockId, uint period) public {

    }

    function roundTimestamp(uint ts) pure internal returns (uint) {
        return ts.div(WEEK).sub(STARTING_POINT_WEEK);
    }
}

