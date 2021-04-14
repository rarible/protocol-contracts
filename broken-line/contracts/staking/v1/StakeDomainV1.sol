pragma solidity ^0.5.0;

contract StakeDomainV1 {
    struct Stake {
        address owner;
        uint amount;
        uint claimed;
        uint unlockPeriod;
        uint unlockTime;
    }
}
