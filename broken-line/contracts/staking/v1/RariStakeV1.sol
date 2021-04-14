pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./RariStakeStateV1.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../RatioFunction.sol";
import "./StakeDomainV1.sol";

contract RariStakeV1 is Ownable, StakeDomainV1 {
    using SafeMath for uint;

    struct ExtendedStake {
        bytes32 id;
        uint available;
        uint power;
        Stake stake;
    }

    IERC20 public token;
    RatioFunction public ratioFunction;
    RariStakeStateV1 public state;
    address public migrateTo;
    uint public migrateTime;
    bool public migrated;

    uint public constant MIGRATE_PERIOD = 86400;

    event StakeCreate(address owner, bytes32 stakeId, uint amount, uint unlockPeriod);
    event StakeAdd(address owner, bytes32 stakeId, uint amount, address adder);
    event StakeUnlock(address owner, bytes32 stakeId);
    event Claim(address owner, bytes32 stakeId, uint amount);
    event ChangeRatioFunction(address f);
    event Migrate(address migrateTo);
    event MigrationFinish();
    event MigrationCancel();

    constructor(IERC20 _token, RatioFunction _ratioFunction, RariStakeStateV1 _state) public {
        token = _token;
        ratioFunction = _ratioFunction;
        state = _state;
    }

    function migrate(address _migrateTo) external onlyOwner {
        require(migrateTo == address(0));
        require(_migrateTo != address(0));

        migrateTo = _migrateTo;
        migrateTime = block.timestamp;
        emit Migrate(_migrateTo);
    }

    function finishMigration() external onlyOwner {
        require(migrateTo != address(0));
        require(migrateTime + MIGRATE_PERIOD <= block.timestamp, "migrate period not passed");

        require(token.transfer(migrateTo, token.balanceOf(address(this))), "transfer unsuccessfull");
        state.transferOwnership(migrateTo);
        migrated = true;
        emit MigrationFinish();
    }

    function cancelMigration() external onlyOwner {
        require(!migrated, "already migrated");
        require(migrateTo != address(0), "migration isn't started");

        migrateTo = address(0);
        migrateTime = 0;

        emit MigrationCancel();
    }

    function setRatioFunction(RatioFunction _ratioFunction) external onlyOwner {
        ratioFunction = _ratioFunction;
        emit ChangeRatioFunction(address(_ratioFunction));
    }

    function lock(bytes32 id, uint amount, uint unlockPeriod) external {
        require(migrateTo == address(0), "migration is started");
        require(state.getStake(id).owner == address(0), "id is already used");
        require(amount > 0, "amount error");

        require(token.transferFrom(msg.sender, address(this), amount), "transfer unsuccessfull");

        Stake memory stake = Stake(msg.sender, amount, 0, unlockPeriod, 0);
        state.addStake(msg.sender, id, stake);
        emit StakeCreate(msg.sender, id, amount, unlockPeriod);
    }

    function add(bytes32 id, uint amount) external {
        require(migrateTo == address(0), "migration is started");
        Stake memory stake = state.getStake(id);
        require(stake.owner != address(0), "stake doesn't exist");
        require(stake.unlockTime == 0, "stake is unlocked");
        require(amount > 0, "amount error");

        require(token.transferFrom(msg.sender, address(this), amount), "transfer unsuccessfull");
        stake.amount = stake.amount.add(amount);
        state.setStake(id, stake);
        emit StakeAdd(stake.owner, id, amount, msg.sender);
    }

    function unlock(bytes32 id) external {
        require(migrateTo == address(0), "migration is started");
        Stake memory s = state.getStake(id);
        require(s.owner == msg.sender, "not an owner");

        s.unlockTime = block.timestamp;
        state.setStake(id, s);
        emit StakeUnlock(msg.sender, id);
    }

    function claim(bytes32 id) external {
        Stake memory s = state.getStake(id);
        require(s.owner == msg.sender, "not an owner");

        uint unlocked = getUnlocked(s);
        uint available = unlocked.sub(s.claimed);
        require(available > 0, "nothing to claim");

        s.claimed = s.claimed.add(available);
        state.setStake(id, s);
        require(s.claimed <= s.amount, "claimed more than locked");
        if (s.claimed == s.amount) {
            bytes32[] memory ids = state.getIds(msg.sender);
            bytes32[] memory newIds = new bytes32[](ids.length - 1);
            uint j = 0;
            for (uint i = 0; i < ids.length; i++) {
                if (ids[i] != id) {
                    newIds[j] = ids[i];
                    j++;
                }
            }
            state.setIds(msg.sender, newIds);
        }
        require(token.transfer(msg.sender, available), "transfer unsuccessfull");
        emit Claim(msg.sender, id, available);
    }

    function getStakes(address owner) external view returns (ExtendedStake[] memory) {
        bytes32[] memory ids = state.getIds(owner);
        ExtendedStake[] memory result = new ExtendedStake[](ids.length);
        for (uint i = 0; i < ids.length; i++) {
            bytes32 id = ids[i];
            result[i] = getStake(id, state.getStake(id));
        }
        return result;
    }

    function getStake(bytes32 id) external view returns (ExtendedStake memory) {
        return getStake(id, state.getStake(id));
    }

    function getStake(bytes32 id, Stake memory s) internal view returns (ExtendedStake memory) {
        (uint power, uint unlocked) = getPower(s);
        return ExtendedStake(id, unlocked.sub(s.claimed), power, s);
    }

    function getPowers(address[] calldata owners) external view returns (uint[] memory) {
        uint[] memory result = new uint[](owners.length);
        for (uint i = 0; i < owners.length; i++) {
            result[i] = getPower(owners[i]);
        }
        return result;
    }

    function balanceOf(address owner) external view returns (uint) {
        return getPower(owner);
    }

    function getPower(address owner) public view returns (uint) {
        bytes32[] memory ids = state.getIds(owner);
        uint balance = token.balanceOf(owner);
        uint total = 0;
        for (uint i = 0; i < ids.length; i++) {
            Stake memory s = state.getStake(ids[i]);
            (uint power, uint unlocked) = getPower(s);
            total = total.add(power);
            balance = balance.add(unlocked.sub(s.claimed));
        }
        total = total.add(balance.mul(getRatio(0)).div(10**18));
        return total;
    }

    function getPower(Stake memory s) internal view returns (uint power, uint unlocked) {
        unlocked = getUnlocked(s);
        uint current = s.amount.sub(unlocked);
        power = current.mul(getRatio(s.unlockPeriod)).div(10**18);
    }

    function getRatio(uint unlockPeriod) public view returns (uint) {
        return ratioFunction.getRatio(unlockPeriod);
    }

    function getUnlocked(Stake memory s) internal view returns (uint) {
        if (migrateTo != address(0)) {
            return s.amount;
        } else if (s.unlockTime != 0) {
            if (block.timestamp >= s.unlockTime.add(s.unlockPeriod)) {
                return s.amount;
            } else {
                uint diff = block.timestamp.sub(s.unlockTime);
                return s.amount.mul(diff).div(s.unlockPeriod);
            }
        } else {
            return 0;
        }
    }
}
