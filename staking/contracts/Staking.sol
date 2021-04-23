// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@rarible/lib-broken-line/contracts/LibBrokenLine.sol";

/**
  * balanceOf(address account) - текущий баланс (сумма всех локов) юзера
  * totalSupply() - общий баланс всех юзеров
  * createLock(uint value, uint period, uint cliff) - сколько залочим, на какой срок, сколько cliff длиной
  **/

contract Staking {
    using SafeMathUpgradeable for uint;
    using LibBrokenLine for BrokenLineDomain.BrokenLine;
    uint256 constant WEEK = 604800;                 //seconds one week
    address public stakingContractAddress = address(this); //адрес для мапы userBalances, куда буду сохранять общий баланс всех users

    mapping(address => BrokenLineDomain.BrokenLine) public userBalances; //address - line
    BrokenLineDomain.BrokenLine public totalBalances;
    uint public idLock;

    constructor() public { //todo сделать, чтобы вызывался единожды!!!
        idLock = 1;
        //todo initialize totalBalances
    }

    function createLock(address account, uint amount, uint period, uint cliff) public returns (uint) {
        //todo проверки
        uint blockTime = roundTimestamp(block.timestamp);
        BrokenLineDomain.Line memory line = createLine(blockTime, amount, period);
        idLock++;
        userBalances[account].add(line, cliff);
        totalBalances.add(line, cliff); //первый способ сохранить в totalBalance Error: Returned error: VM Exception while processing transaction: revert
//        userBalances[stakingContractAddress].add(line, cliff); //второй способ сохранить в totalBalance Error: Returned error: VM Exception while processing transaction: revert
        return idLock;

        // как меняется lock общий, когда юзер приходит/уходит/меняет
        // 1. нужно применить пропущенные изменения (окончания локов)
        // 2. если добавляем, то
    }

    function totalSupply() public returns (uint){

    }

    function balanceOf(address account) public returns (uint) {
        if (userBalances[account].initial.start == 0) { //no lock
            return 0;
        }
        userBalances[account].update(roundTimestamp(block.timestamp));
        return userBalances[account].initial.bias;
    }

    function increaseUnlockTime(uint lockId, uint period) public {

    }

    function increaseLockedValue(uint lockId, uint period) public {

    }

    function withdraw() internal {

    }

    function createLine(uint blockTime, uint amount, uint period) internal pure returns (BrokenLineDomain.Line memory) {
        require(blockTime != 0, "require start deposit time not equal 0");
        require(period != 0, "require period deposit time not equal 0");
        return BrokenLineDomain.Line(blockTime, amount, amount.div(period));
    }

    function roundTimestamp(uint ts) pure internal returns (uint) {
        return ts.div(WEEK);
    }

}

