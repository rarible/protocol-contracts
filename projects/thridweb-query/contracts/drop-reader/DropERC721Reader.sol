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


//  ==========  Features    ==========

import "hardhat/console.sol";
import "@thirdweb-dev/contracts/eip/interface/IERC20.sol";

import "@openzeppelin/contracts-upgradeable-4-7-3/access/OwnableUpgradeable.sol";
import "./IDropERC721.sol";

contract DropERC721Reader is Initializable, OwnableUpgradeable {

    enum FeeType {
        Bps,
        Flat
    }

    struct FeeData {
        address recipient;
        uint256 value;
        FeeType feeType;
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
        IDropERC721.ClaimCondition[] memory conditions,
        GlobalData memory globalData
        ) {
        IDropERC721 drop = IDropERC721(_dropERC721);

        (uint256 startConditionIndex, uint256 stopConditionIndex)  = drop.claimCondition();
        uint256 _claimedByUser = 0;
        if(stopConditionIndex != 0) {
            try drop.getActiveClaimConditionId() returns (uint256 _activeClaimConditionIndex) {
                activeClaimConditionIndex = _activeClaimConditionIndex;
            } catch {
                activeClaimConditionIndex = 0;
            }
            conditions = new IDropERC721.ClaimCondition[](stopConditionIndex);
            
            for (uint i = 0; i < stopConditionIndex; i++) {
                IDropERC721.ClaimCondition memory condition = drop.getClaimConditionById(i);
                conditions[i] = condition;
            }
        }

        DropERC721Reader.GlobalData memory _globalData;
        if(stopConditionIndex > 0) {
            _claimedByUser = drop.getSupplyClaimedByWallet(activeClaimConditionIndex, _claimer);
            IDropERC721.ClaimCondition memory condition = drop.getClaimConditionById(activeClaimConditionIndex);
            if(condition.currency == native1 || condition.currency == native2) {
                _globalData.userBalance = _claimer.balance;
            } else {
                _globalData.userBalance = IERC20(condition.currency).balanceOf(_claimer);
            }

        }

        _globalData.totalMinted         = drop.totalMinted();
        _globalData.claimedByUser       = _claimedByUser;
        _globalData.totalSupply         = drop.totalSupply();
        try drop.maxTotalSupply() returns (uint maxTotalSupply) {
            _globalData.maxTotalSupply      = maxTotalSupply;
        } catch {
            _globalData.maxTotalSupply      = 0;
        }        
        _globalData.nextTokenIdToMint   = drop.nextTokenIdToMint();
        _globalData.nextTokenIdToClaim  = drop.nextTokenIdToClaim();
        _globalData.name                = drop.name();
        _globalData.symbol              = drop.symbol();
        _globalData.contractURI         = drop.contractURI();
        try drop.getBaseURICount() returns (uint baseURICount) {
            _globalData.baseURICount        = baseURICount;
        } catch {
            _globalData.baseURICount        = 0;
        }
        
        _globalData.blockTimeStamp      = block.timestamp;

        (address rAddress, uint16 rBps)     = drop.getDefaultRoyaltyInfo();
        _globalData.defaultRoyaltyInfo.recipient    = rAddress;
        _globalData.defaultRoyaltyInfo.value        = rBps;
        _globalData.defaultRoyaltyInfo.feeType      = FeeType.Bps;

        IDropERC721.PlatformFeeType feeType = IDropERC721.PlatformFeeType.Bps;
        try drop.getPlatformFeeType() returns (IDropERC721.PlatformFeeType resultFeeType) {
            feeType = resultFeeType;
        } catch {
            feeType = IDropERC721.PlatformFeeType.Bps;
        }
        
        if (feeType == IDropERC721.PlatformFeeType.Flat) {
            (address pAddress, uint256 pValue)     = drop.getFlatPlatformFeeInfo();
            _globalData.platformFeeInfo.recipient       = pAddress;
            _globalData.platformFeeInfo.value           = pValue;
            _globalData.platformFeeInfo.feeType         = FeeType.Flat;
        } else {
            (address pAddress, uint16 pBps)     = drop.getPlatformFeeInfo();
            _globalData.platformFeeInfo.recipient       = pAddress;
            _globalData.platformFeeInfo.value           = pBps;
            _globalData.platformFeeInfo.feeType         = FeeType.Bps;
        }

        return (activeClaimConditionIndex, conditions, _globalData);
    }
}