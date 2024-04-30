// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.11;

/// @author rarible

//    /$$$$$$$                      /$$ /$$       /$$
//    | $$__  $$                    |__/| $$      | $$
//    | $$  \ $$  /$$$$$$   /$$$$$$  /$$| $$$$$$$ | $$  /$$$$$$
//    | $$$$$$$/ |____  $$ /$$__  $$| $$| $$__  $$| $$ /$$__  $$
//    | $$__  $$  /$$$$$$$| $$  \__/| $$| $$  \ $$| $$| $$$$$$$$
//    | $$  \ $$ /$$__  $$| $$      | $$| $$  | $$| $$| $$_____/
//    | $$  | $$|  $$$$$$$| $$      | $$| $$$$$$$/| $$|  $$$$$$$
//    |__/  |__/ \_______/|__/      |__/|_______/ |__/ \_______/


//  ==========  External imports    ==========

import "@openzeppelin/contracts-upgradeable/utils/MulticallUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol";

import "@thirdweb-dev/contracts/eip/ERC721AVirtualApproveUpgradeable.sol";

//  ==========  Features    ==========

import "@thirdweb-dev/contracts/extension/Drop.sol";
import "@thirdweb-dev/contracts/extension/interface/IClaimCondition.sol";

import "@thirdweb-dev/contracts/prebuilts/drop/DropERC721.sol";
import "hardhat/console.sol";
import "@thirdweb-dev/contracts/eip/interface/IERC20.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";


contract DropERC721Reader is Initializable, OwnableUpgradeable {

    struct FeeData {
        address recipient;
        uint256 bps;
    }

    struct GlobalData {
        uint256 totalMinted;
        uint256 claimedByUser;
        uint256 totalSupply;
        uint256 maxTotalSupply;
        uint256 nextTokenIdToMint;
        uint256 nextTokenIdToClaim;
        string name;
        string symbol;
        string contractURI;
        uint256 baseURICount;
        uint256 userBalance;
        uint256 blockTimeStamp;
        FeeData defaultRoyaltyInfo;
        FeeData platformFeeInfo;
    }

    address public native1;
    address public native2;

    function initialize(address _native1, address _native2, address initialOwner) public initializer {
        __Ownable_init();
        native1 = _native1;
        native2 = _native2;
        // Transfer ownership to the initial owner provided
        _transferOwnership(initialOwner);
    }

    function getAllData(
        address _dropERC721,
        address _claimer
    ) public view returns (
        uint256 activeClaimConditionIndex,
        IClaimCondition.ClaimCondition[] memory conditions,
        GlobalData memory globalData
        ) {
        DropERC721 drop = DropERC721(_dropERC721);

        (uint256 startConditionIndex,uint256 stopConditionIndex)  = drop.claimCondition();
        uint256 _claimedByUser = 0;
        if(stopConditionIndex != 0) {
            try drop.getActiveClaimConditionId() returns (uint256 _activeClaimConditionIndex) {
                activeClaimConditionIndex = _activeClaimConditionIndex;
            } catch {
                activeClaimConditionIndex = 0;
            }
            conditions = new IClaimCondition.ClaimCondition[](stopConditionIndex);
            
            for (uint i = 0; i < stopConditionIndex; i++) {
                IClaimCondition.ClaimCondition memory condition = drop.getClaimConditionById(i);
                conditions[i] = condition;
            }
        }

        DropERC721Reader.GlobalData memory _globalData;
        if(stopConditionIndex > 0) {
            _claimedByUser = drop.getSupplyClaimedByWallet(activeClaimConditionIndex, _claimer);
            IClaimCondition.ClaimCondition memory condition = drop.getClaimConditionById(activeClaimConditionIndex);
            if(condition.currency == native1 || condition.currency == native2) {
                _globalData.userBalance = _claimer.balance;
            } else {
                _globalData.userBalance = IERC20(condition.currency).balanceOf(_claimer);
            }

        }

        _globalData.totalMinted         = drop.totalMinted();
        _globalData.claimedByUser       = _claimedByUser;
        _globalData.totalSupply         = drop.totalSupply();
        _globalData.maxTotalSupply      = drop.maxTotalSupply();
        _globalData.nextTokenIdToMint   = drop.nextTokenIdToMint();
        _globalData.nextTokenIdToClaim  = drop.nextTokenIdToClaim();
        _globalData.name                = drop.name();
        _globalData.symbol              = drop.symbol();
        _globalData.contractURI         = drop.contractURI();
        _globalData.baseURICount        = drop.getBaseURICount();
        _globalData.blockTimeStamp      = block.timestamp;
        (address rAddress, uint16 rBps)     = drop.getDefaultRoyaltyInfo();
        _globalData.defaultRoyaltyInfo.recipient    = rAddress;
        _globalData.defaultRoyaltyInfo.bps          = rBps;

        (address pAddress, uint16 pBps)     = drop.getPlatformFeeInfo();
        _globalData.platformFeeInfo.recipient       = pAddress;
        _globalData.platformFeeInfo.bps             = pBps;
        return (activeClaimConditionIndex, conditions, _globalData);
    }
}