// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@rarible/lib-broken-line/contracts/LibBrokenLine.sol";
import "@rarible/lib-broken-line/contracts/LibIntMapping.sol";

contract Staking {
    using SafeMathUpgradeable for uint;
    using LibBrokenLine for LibBrokenLine.BrokenLine;

    uint256 constant WEEK = 604800;                         //seconds one week
    uint256 constant STARTING_POINT_WEEK = 2676;            //starting point week (Staking Epoch begining)
    uint256 constant TWO_YEAR_WEEKS = 104;                  //two year weeks
    uint256 constant ST_FORMULA_MULTIPLIER = 1000;          //stFormula multiplier
    uint256 constant ST_FORMULA_SLOPE_MULTIPLIER = 4;       //stFormula slope multiplier
    uint256 constant ST_FORMULA_CLIFF_MULTIPLIER = 8;       //stFormula cliff multiplier
    ERC20Upgradeable public token;
    uint public id;                                         //id Line, successfully added to BrokenLine

    struct Lockers {                        //initiate addresses, user (or contract), who locks and whom delegate
        address locker;                     //locker address (lock creator)
        address delegate;                   //delegate address (delegate creator)
    }

    struct Locks {
        LibBrokenLine.BrokenLine balance;   //line of stRari balance
        LibBrokenLine.BrokenLine locked;    //locked amount (RARI)
        uint amount;                        //user RARI (lockedAmount + amountready for transferBack)
    }

    mapping (address => Locks) locks;                   //address User - Lock
    mapping (uint => Lockers) deposits;                 //idLock address User
    LibBrokenLine.BrokenLine public totalSupplyLine;    //total stRARI balance

    constructor(ERC20Upgradeable _token) public {
        token = _token;
    }

    function stake(address account, address delegate, uint amount, uint slope, uint cliff) public returns(uint) {
        if (amount == 0) {
            return 0;
        }
        uint period = amount.div(slope).add(cliff);
        require(period <= TWO_YEAR_WEEKS, "Finish line time more, than two years");
        (uint stAmount, uint stSlope) = getStake(amount, slope, cliff);
        LibBrokenLine.Line memory line = LibBrokenLine.Line(roundTimestamp(block.timestamp), stAmount, stSlope);
        id++;
        totalSupplyLine.add(id, line, cliff);
        locks[delegate].balance.add(id, line, cliff);
        line = LibBrokenLine.Line(roundTimestamp(block.timestamp), amount, slope);
        locks[account].locked.add(id, line, cliff);
        deposits[id].locker = account;
        deposits[id].delegate = delegate;
        locks[account].amount = locks[account].amount.add(amount);
        require(token.transferFrom(account, address(this), amount), "failure while transferring");
        return id;
    }

    function totalSupply() public returns (uint) {
        if (totalSupplyLine.initial.start == 0) { 
            return 0;
        }
        totalSupplyLine.update(roundTimestamp(block.timestamp));
        return totalSupplyLine.initial.bias;
    }

    function balanceOf(address account) public returns (uint) {
        if (locks[account].balance.initial.start == 0) { 
            return 0;
        }
        locks[account].balance.update(roundTimestamp(block.timestamp));
        return locks[account].balance.initial.bias;
    }

    function withdraw() public  {
        locks[msg.sender].locked.update(roundTimestamp(block.timestamp));
        uint value = locks[msg.sender].amount.sub(locks[msg.sender].locked.initial.bias);
        if (value > 0) {
            locks[msg.sender].amount = locks[msg.sender].amount.sub(value);
            require(token.transfer(msg.sender, value), "failure while transferring");
        }
    }

    function reStake(uint idLock, address newDelegate, uint newAmount, uint newSlope, uint newCliff) public returns (uint) {
        address account = deposits[idLock].locker;
        address delegate = deposits[idLock].delegate;
        uint blockTime = roundTimestamp(block.timestamp);
        verification(account, idLock, newAmount, newSlope, newCliff, blockTime);
        locks[account].locked.update(blockTime);
        removeLines(idLock, account, delegate, newAmount, blockTime);
        return addLines(account, newDelegate, newAmount, newSlope, newCliff, blockTime);
    }

    function removeLines(uint idLock, address account, address delegate, uint newAmount, uint toTime) internal {
        uint bias = locks[account].locked.initial.bias;
        uint balance = locks[account].amount.sub(bias);
        (uint residue, uint slope) = locks[account].locked.remove(idLock, toTime);
        require(residue <= newAmount, "Impossible to restake: less amount, then now is");

        uint addAmount = newAmount.sub(residue);
        if (addAmount > balance) { //need more, than balance, so need transfer ERC20 to this
            require(token.transferFrom(deposits[idLock].locker, address(this), addAmount.sub(balance)), "failure while transferring");
            locks[account].amount = locks[account].amount.sub(residue);
            locks[account].amount = locks[account].amount.add(newAmount);
        }
        locks[delegate].balance.remove(idLock, toTime);
        totalSupplyLine.remove(idLock, toTime);
    }

    function addLines(address account, address newDelegate, uint newAmount, uint newSlope, uint newCliff, uint blockTime) internal returns (uint) {
        (uint stAmount, uint stSlope) = getStake(newAmount, newSlope, newCliff);
        LibBrokenLine.Line memory line = LibBrokenLine.Line(blockTime, stAmount, stSlope);
        id++;
        totalSupplyLine.add(id, line, newCliff);
        locks[newDelegate].balance.add(id, line, newCliff);
        line = LibBrokenLine.Line(blockTime, newAmount, newSlope);
        locks[account].locked.add(id, line, newCliff);
        deposits[id].locker = account;
        deposits[id].delegate = newDelegate;
        return id;
    }
    
    //calculate and return (newAmount, newSlope), using formula k=(1000+((cliffPeriod)^2)*8+((slopePeriod)^2)*4)/1000, newAmount=k*amount
    function getStake(uint amount, uint slope, uint cliff) internal returns (uint, uint) {
        uint cliffSide = cliff.mul(cliff).mul(ST_FORMULA_CLIFF_MULTIPLIER);

        uint slopePeriod = amount.div(slope);
        uint slopeSide = slopePeriod.mul(slopePeriod).mul(ST_FORMULA_SLOPE_MULTIPLIER);
        uint amountMultiplier = cliffSide.add(slopeSide).add(ST_FORMULA_MULTIPLIER).div(ST_FORMULA_MULTIPLIER);
        uint newAmount = amount.mul(amountMultiplier);
        uint newSlope = newAmount.div(slopePeriod);
        return(newAmount, newSlope);
    }

    function verification(address account, uint idLock, uint newAmount, uint newSlope, uint newCliff, uint toTime) internal {
        require(account != address(0), "Line with idLock already deleted");
        require(locks[account].amount >= locks[account].locked.initial.bias, "Impossible to restake: amount < bias");
        uint period = newAmount.div(newSlope).add(newCliff);
        require(period <= TWO_YEAR_WEEKS, "New finish line time more, than two years");
        uint end = toTime.add(period);
        LibBrokenLine.LineData memory lineData = locks[account].locked.initiatedLines[idLock];
        LibBrokenLine.Line memory line = lineData.line;
        uint oldPeriod = line.bias.div(line.slope);
        uint oldEnd = line.start.add(lineData.cliff).add(oldPeriod);
        require(oldEnd <= end, "New line period stake too short");
    }

    function delegate(uint idLock, address newDelegate) public {
        address account = deposits[idLock].delegate;
        require(account != address(0), "Delegate from address by idLock not found");
        LibBrokenLine.LineData memory lineData = locks[account].balance.initiatedLines[idLock];
        require(lineData.line.bias != 0, "Line already finished nothing to delegate");
        uint blockTime = roundTimestamp(block.timestamp);
        (uint bias, uint slope) = locks[account].balance.remove(idLock, blockTime);
        uint cliff = lineData.cliff;
        LibBrokenLine.Line memory line = LibBrokenLine.Line(blockTime, bias, slope);
        locks[newDelegate].balance.add(idLock, line, cliff);
        deposits[idLock].delegate = newDelegate;
    }

    function roundTimestamp(uint ts) pure internal returns (uint) {
        return ts.div(WEEK).sub(STARTING_POINT_WEEK);
    }
}