pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./StakeDomainV1.sol";

contract RariStakeStateV1 is Ownable, StakeDomainV1 {

    mapping(bytes32 => Stake) public stakes;
    mapping(address => bytes32[]) public idsByOwner;

    function getIds(address owner) external view returns (bytes32[] memory) {
        return idsByOwner[owner];
    }

    function addStake(address owner, bytes32 id, Stake calldata _stake) external onlyOwner {
        idsByOwner[owner].push(id);
        Stake memory stake = _stake;
        stakes[id] = stake;
    }

    function setIds(address owner, bytes32[] calldata _ids) external onlyOwner {
        idsByOwner[owner] = _ids;
    }

    function getStake(bytes32 id) external view returns (Stake memory) {
        return stakes[id];
    }

    function setStake(bytes32 id, Stake calldata _stake) external onlyOwner {
        Stake memory stake = _stake;
        stakes[id] = stake;
    }
}
