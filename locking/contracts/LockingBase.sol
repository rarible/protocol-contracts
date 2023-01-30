// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./libs/LibBrokenLine.sol";

import "./IVotesUpgradeable.sol";

abstract contract LockingBase is OwnableUpgradeable, IVotesUpgradeable {
    using SafeMathUpgradeable96 for uint96;
    using SafeMathUpgradeable32 for uint32;
    
    using LibBrokenLine for LibBrokenLine.BrokenLine;

    uint32 constant public WEEK = 50400; //blocks one week = 50400, day = 7200, goerli = 50
    
    uint32 constant MAX_CLIFF_PERIOD = 103;
    uint32 constant MAX_SLOPE_PERIOD = 104;

    uint32 constant ST_FORMULA_DIVIDER =  1 * (10 ** 8);           //stFormula divider          100000000
    uint32 constant ST_FORMULA_CONST_MULTIPLIER = 2 * (10 ** 7);   //stFormula const multiplier  20000000
    uint32 constant ST_FORMULA_CLIFF_MULTIPLIER = 8 * (10 ** 7);   //stFormula cliff multiplier  80000000
    uint32 constant ST_FORMULA_SLOPE_MULTIPLIER = 4 * (10 ** 7);   //stFormula slope multiplier  40000000

    /**
     * @dev ERC20 token to lock
     */
    IERC20Upgradeable public token;
    /**
     * @dev counter for Lock identifiers
     */
    uint public counter;

    /**
     * @dev true if contract entered stopped state
     */
    bool public stopped;

    /**
     * @dev address to migrate Locks to (zero if not in migration state)
     */
    address public migrateTo;

    /**
     * @dev minimal cliff period in weeks, minCliffPeriod < MAX_CLIFF_PERIOD
     */

    uint32 public minCliffPeriod;

    /**
     * @dev minimal slope period in weeks, minSlopePeriod < MAX_SLOPE_PERIOD
     */
    uint32 public minSlopePeriod;

    /**
     * @dev locking epoch start in weeks
     */
    uint32 public startingPointWeek;

    /**
     * @dev represents one user Lock
     */
    struct Lock {
        address account;
        address delegate;
    }

    /**
     * @dev describes state of accounts's balance.
     *      balance - broken line describes lock
     *      locked - broken line describes how many tokens are locked
     *      amount - total currently locked tokens (including tokens which can be withdrawed)
     */
    struct Account {
        LibBrokenLine.BrokenLine balance;
        LibBrokenLine.BrokenLine locked;
        uint96 amount;
    }

    mapping(address => Account) accounts;
    mapping(uint => Lock) locks;
    LibBrokenLine.BrokenLine public totalSupplyLine;

    /**
     * @dev Emitted when create Lock with parameters (account, delegate, amount, slopePeriod, cliff)
     */
    event LockCreate(uint indexed id, address indexed account, address indexed delegate, uint time, uint amount, uint slopePeriod, uint cliff);
    /**
     * @dev Emitted when change Lock parameters (newDelegate, newAmount, newSlopePeriod, newCliff) for Lock with given id
     */
    event Relock(uint indexed id, address indexed account, address indexed delegate, uint counter, uint time, uint amount, uint slopePeriod, uint cliff);
    /**
     * @dev Emitted when to set newDelegate address for Lock with given id
     */
    event Delegate(uint indexed id, address indexed account, address indexed delegate, uint time);
    /**
     * @dev Emitted when withdraw amount of Rari, account - msg.sender, amount - amount Rari
     */
    event Withdraw(address indexed account, uint amount);
    /**
     * @dev Emitted when migrate Locks with given id, account - msg.sender
     */
    event Migrate(address indexed account, uint[] id);
    /**
     * @dev Stop run contract functions, accept withdraw, account - msg.sender
     */
    event StopLocking(address indexed account);
    /**
     * @dev Start run contract functions, accept withdraw, account - msg.sender
     */
    event StartLocking(address indexed account);
    /**
     * @dev StartMigration initiate migration to another contract, account - msg.sender, to - address delegate to
     */
    event StartMigration(address indexed account, address indexed to);
    /**
     * @dev set newMinCliffPeriod
     */
    event SetMinCliffPeriod(uint indexed newMinCliffPeriod);
    /**
     * @dev set newMinSlopePeriod
     */
    event SetMinSlopePeriod(uint indexed newMinSlopePeriod);
    /**
     * @dev set startingPointWeek
     */
    event SetStartingPointWeek(uint indexed newStartingPointWeek);

    function __LockingBase_init_unchained(IERC20Upgradeable _token, uint32 _startingPointWeek, uint32 _minCliffPeriod, uint32 _minSlopePeriod) internal initializer {
        token = _token;
        startingPointWeek = _startingPointWeek;

        //setting min cliff and slope
        require(_minCliffPeriod <= MAX_CLIFF_PERIOD, "cliff too big");
        require(_minSlopePeriod <= MAX_SLOPE_PERIOD, "period too big");
        minCliffPeriod = _minCliffPeriod;
        minSlopePeriod = _minSlopePeriod;
    }

    function addLines(address account, address _delegate, uint96 amount, uint32 slopePeriod, uint32 cliff, uint32 time) internal {
        require(slopePeriod <= amount, "Wrong value slopePeriod");
        updateLines(account, _delegate, time);
        (uint96 stAmount, uint96 stSlope) = getLock(amount, slopePeriod, cliff);
        LibBrokenLine.Line memory line = LibBrokenLine.Line(time, stAmount, stSlope, cliff);
        totalSupplyLine.add(counter, line);
        accounts[_delegate].balance.add(counter, line);
        uint96 slope = divUp(amount, slopePeriod);
        line = LibBrokenLine.Line(time, amount, slope, cliff);
        accounts[account].locked.add(counter, line);
        locks[counter].account = account;
        locks[counter].delegate = _delegate;
    }

    function updateLines(address account, address _delegate, uint32 time) internal {
        totalSupplyLine.update(time);
        accounts[_delegate].balance.update(time);
        accounts[account].locked.update(time);
    }

    /**
     * Сalculate and return (newAmount, newSlope), using formula:
     * locking = (tokens * (
     *      ST_FORMULA_CONST_MULTIPLIER
     *      + ST_FORMULA_CLIFF_MULTIPLIER * (cliffPeriod - minCliffPeriod))/(MAX_CLIFF_PERIOD - minCliffPeriod)
     *      + ST_FORMULA_SLOPE_MULTIPLIER * (slopePeriod - minSlopePeriod))/(MAX_SLOPE_PERIOD - minSlopePeriod)
     *      )) / ST_FORMULA_DIVIDER
     **/
    function getLock(uint96 amount, uint32 slopePeriod, uint32 cliff) public view returns (uint96 lockAmount, uint96 lockSlope) {
        require(cliff >= minCliffPeriod, "cliff period < minimal lock period");
        require(slopePeriod >= minSlopePeriod, "slope period < minimal lock period");

        uint96 cliffSide = uint96((cliff - minCliffPeriod)).mul(ST_FORMULA_CLIFF_MULTIPLIER).div(MAX_CLIFF_PERIOD - minCliffPeriod);
        uint96 slopeSide = uint96((slopePeriod - minSlopePeriod)).mul(ST_FORMULA_SLOPE_MULTIPLIER).div(MAX_SLOPE_PERIOD - minSlopePeriod);
        uint96 multiplier = cliffSide.add(slopeSide).add(ST_FORMULA_CONST_MULTIPLIER);

        lockAmount = amount.mul(multiplier).div(ST_FORMULA_DIVIDER);
        lockSlope = divUp(lockAmount, slopePeriod);
    }

    function divUp(uint96 a, uint96 b) internal pure returns (uint96) {
        return ((a.sub(1)).div(b)).add(1);
    }
    
    function roundTimestamp(uint32 ts) view public returns (uint32) {
        if (ts < getEpochShift()) {
            return 0;
        }
        uint32 shifted = ts.sub(getEpochShift());
        return shifted.div(WEEK).sub(startingPointWeek);
    }

    /**
    * @notice method returns the amount of blocks to shift locking epoch to.
    * By the time of development, the default weekly-epoch calculated by main-net block number
    * would start at about 11-35 UTC on Tuesday
    * we move it to 00-00 UTC Thursday by adding 10800 blocks (approx)
    */
    function getEpochShift() internal view virtual returns (uint32) {
        return 10800;
    }

    function verifyLockOwner(uint id) internal view returns (address account) {
        account = locks[id].account;
        require(account == msg.sender, "caller not a lock owner");
    }

    function getBlockNumber() internal virtual view returns (uint32) {
        return uint32(block.number);
    }

    function setStartingPointWeek(uint32 newStartingPointWeek) public notStopped notMigrating onlyOwner {
        require(newStartingPointWeek < roundTimestamp(getBlockNumber()) , "wrong newStartingPointWeek");
        startingPointWeek = newStartingPointWeek;

        emit SetStartingPointWeek(newStartingPointWeek);
    } 

    function setMinCliffPeriod(uint32 newMinCliffPeriod) external  notStopped notMigrating onlyOwner {
        require(newMinCliffPeriod < MAX_CLIFF_PERIOD, "new cliff period > 2 years");
        minCliffPeriod = newMinCliffPeriod;

        emit SetMinCliffPeriod(newMinCliffPeriod);
    }

    function setMinSlopePeriod(uint32 newMinSlopePeriod) external  notStopped notMigrating onlyOwner {
        require(newMinSlopePeriod < MAX_SLOPE_PERIOD, "new slope period > 2 years");
        minSlopePeriod = newMinSlopePeriod;

        emit SetMinSlopePeriod(newMinSlopePeriod);
    }

    /**
     * @dev Throws if stopped
     */
    modifier notStopped() {
        require(!stopped, "stopped");
        _;
    }

    /**
     * @dev Throws if not stopped
     */
    modifier isStopped() {
        require(stopped, "not stopped");
        _;
    }

    modifier notMigrating() {
        require(migrateTo == address(0), "migrating");
        _;
    }

    function updateAccountLines(address account, uint32 time) public notStopped notMigrating onlyOwner {
        accounts[account].balance.update(time);
        accounts[account].locked.update(time);
    }

    function updateTotalSupplyLine(uint32 time) public notStopped notMigrating onlyOwner {
        totalSupplyLine.update(time);
    }

    function updateAccountLinesBlockNumber(address account, uint32 blockNumber) external notStopped notMigrating onlyOwner {
        uint32 time = roundTimestamp(blockNumber);
        updateAccountLines(account, time);
    }
    
    function updateTotalSupplyLineBlockNumber(uint32 blockNumber) external notStopped notMigrating onlyOwner {
        uint32 time = roundTimestamp(blockNumber);
        updateTotalSupplyLine(time);
    }

    //add minCliffPeriod, decrease __gap
    //add minSlopePeriod, decrease __gap
    uint256[48] private __gap;

}
