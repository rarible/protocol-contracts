pragma solidity ^0.5.0;

//todo check uint sizes
//todo safe math
//todo нужно ли сохранять endTime или что считать правдой? кажется, оно может поменяться при пересчетах
contract RariStakeV2 {
    uint256 constant WEEK = 86400 * 7;

    struct Line {
        uint ts; //start time
        uint bias; //bias at ts
        uint slope; //slope of the line
    }

    struct Lock {
        uint dt; //deposit time
        uint amount; //amount deposited
        uint et; //end time
    }

    mapping(address => Lock) public locks;

    constructor() public {

    }

    function _deposit(address account, uint amount, uint endTime) internal {
        //todo проверки
        Lock memory lock = locks[account];
        uint blockTime = roundTimestamp(block.timestamp);
        if (lock.dt == 0) {//no lock at all, add new lock
            locks[account] = Lock(blockTime, amount, endTime);
        } else {
            require(blockTime < lock.et, "lock expired");
            locks[account] = Lock(blockTime, amount, endTime);
        }
        // как меняется lock общий, когда юзер приходит/уходит/меняет
        // 1. нужно применить пропущенные изменения (окончания локов)
        // 2. если добавляем, то
    }

    function _increaseUnlockTime(address account, uint newUnlockTime) internal {

    }

    function _withdraw() internal {

    }

    function balanceOf(address account) public view returns (uint) {
        Lock memory lock = locks[account];
        if (lock.dt == 0) { //no lock
            return 0;
        }
        return balanceOf(lockToLine(lock), roundTimestamp(block.timestamp));
    }

    function balanceOf(Line memory line, uint time) pure internal returns (uint) {
        //change of bias
        uint change = line.slope * (time - line.ts);
        if (change >= line.bias) {// lock expired
            return 0;
        } else {
            return line.bias - change;
        }
    }

    function lockToLine(Lock memory lock) internal pure returns (Line memory) {
        require(lock.dt != 0, "lock is not defined");
        return Line(lock.dt, lock.amount, lock.amount / (lock.et - lock.dt));
    }

    function roundTimestamp(uint ts) pure internal returns (uint) {
        return ts / WEEK;
    }
}
