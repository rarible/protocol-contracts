// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.5.0 <0.9.0;

import "../system-contracts/HederaResponseCodes.sol";
import "../system-contracts/hedera-token-service/IHederaTokenService.sol";
import "../system-contracts/hedera-token-service/HederaTokenService.sol";
import "../system-contracts/hedera-token-service/ExpiryHelper.sol";
import "../system-contracts/hedera-token-service/KeyHelper.sol";

contract RariNFTCreator is ExpiryHelper, KeyHelper, HederaTokenService {


    struct RoyaltyFeeParams {
        address feeCollector;
        bool isRoyaltyFee;
        int64 feeAmount;
        address fixedFeeTokenAddress;
        bool useHbarsForPayment;
        bool isMultipleRoyaltyFee;
        address feeCollector2;
        int64 secondfeeAmount;
        address secondFixedFeeTokenAddress;
        bool useHbarsForPaymentSecondFixFee;
    }

    struct FixFeeParams {
        address feeCollector;
        bool isFractionalFee;
        bool isFixedFee;
        int64 feeAmount;
        address fixedFeeTokenAddress;
        bool useHbarsForPayment;
        bool useCurrentTokenForPayment;
        bool isMultipleFixedFee;
        address feeCollector2;
        int64 secondfeeAmount;
        address secondFixedFeeTokenAddress;
        bool useHbarsForPaymentSecondFixFee;
        bool useCurrentTokenForPaymentSecondFixFee;
    }

    event CreatedToken(address tokenAddress);

    function createNftCollection(
            string memory name, 
            string memory symbol, 
            string memory memo, 
            int64 maxSupply,  
            int64 autoRenewPeriod
        ) external payable returns (address){

        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](1);
        // Set this contract as supply for the token
        keys[0] = getSingleKey(KeyType.SUPPLY, KeyValueType.CONTRACT_ID, address(this));

        IHederaTokenService.HederaToken memory token;
        token.name = name;
        token.symbol = symbol;
        token.memo = memo;
        token.treasury = address(this);
        token.tokenSupplyType = true; // set supply to FINITE
        token.maxSupply = maxSupply;
        token.tokenKeys = keys;
        token.freezeDefault = false;
        token.expiry = createAutoRenewExpiry(address(this), autoRenewPeriod); // Contract auto-renews the token

        (int responseCode, address createdToken) = HederaTokenService.createNonFungibleToken(token);

        if(responseCode != HederaResponseCodes.SUCCESS){
            revert("Failed to create non-fungible token");
        }

        emit CreatedToken(createdToken);

        return createdToken;
    }

    function createNftCollectionWithFeesAndRoyalty(
            string memory name, 
            string memory symbol, 
            string memory memo, 
            int64 maxSupply,  
            int64 autoRenewPeriod,
            FixFeeParams memory params,
            RoyaltyFeeParams memory royaltyParams
        ) external payable returns (address) {

        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](1);
        // Set this contract as supply for the token
        keys[0] = getSingleKey(KeyType.SUPPLY, KeyValueType.CONTRACT_ID, address(this));

        IHederaTokenService.HederaToken memory token;
        token.name = name;
        token.symbol = symbol;
        token.memo = memo;
        token.treasury = address(this);
        token.tokenSupplyType = true; // set supply to FINITE
        token.maxSupply = maxSupply;
        token.tokenKeys = keys;
        token.freezeDefault = false;
        token.expiry = createAutoRenewExpiry(address(this), autoRenewPeriod); // Contract auto-renews the token

        IHederaTokenService.FixedFee[] memory fixedFees = new IHederaTokenService.FixedFee[](2);

        if(params.isFixedFee) {
            if(params.isMultipleFixedFee) {
                fixedFees = new IHederaTokenService.FixedFee[](2);
            } else {
                fixedFees = new IHederaTokenService.FixedFee[](1);
            }
        fixedFees[0] = IHederaTokenService.FixedFee(params.feeAmount, params.fixedFeeTokenAddress, params.useHbarsForPayment, params.useCurrentTokenForPayment, params.feeCollector);
            if(params.isMultipleFixedFee) {
        fixedFees[1] = IHederaTokenService.FixedFee(params.secondfeeAmount, params.secondFixedFeeTokenAddress, params.useHbarsForPaymentSecondFixFee, params.useCurrentTokenForPaymentSecondFixFee, params.feeCollector2);
            }
        } else {
            fixedFees = new IHederaTokenService.FixedFee[](0);
        }

        IHederaTokenService.RoyaltyFee[] memory royaltyFees = new IHederaTokenService.RoyaltyFee[](2);

        if(royaltyParams.isRoyaltyFee) {
            if(royaltyParams.isMultipleRoyaltyFee) {
                royaltyFees = new IHederaTokenService.RoyaltyFee[](2);
            } else {
                royaltyFees = new IHederaTokenService.RoyaltyFee[](1);
            }
        royaltyFees[0] = IHederaTokenService.RoyaltyFee(1, 10, royaltyParams.feeAmount, royaltyParams.fixedFeeTokenAddress, royaltyParams.useHbarsForPayment, royaltyParams.feeCollector);
            if(royaltyParams.isMultipleRoyaltyFee) {
        royaltyFees[1] = IHederaTokenService.RoyaltyFee(1, 10, royaltyParams.secondfeeAmount, royaltyParams.secondFixedFeeTokenAddress, royaltyParams.useHbarsForPaymentSecondFixFee, royaltyParams.feeCollector2);
            }
        } else {
            royaltyFees = new IHederaTokenService.RoyaltyFee[](0);
        }


        (int responseCode, address tokenAddress) = HederaTokenService.createNonFungibleTokenWithCustomFees(token, fixedFees, royaltyFees);


        if(responseCode != HederaResponseCodes.SUCCESS){
            revert("Failed to create non-fungible token");
        }

        emit CreatedToken(tokenAddress);

        return tokenAddress;
    }

    // IPFS content identifier (CID) that points to your metadata
    // String CID = ("QmTzWcVfk88JRqjTpVwHzBeULRTNzHY7mnBSG42CpwHmPa") ;
    // .addMetadata(CID.getBytes())
    function mintNft(
        address token,
        bytes[] memory metadata
    ) external returns(int64){

        (int response, , int64[] memory serial) = HederaTokenService.mintToken(token, 0, metadata);

        if(response != HederaResponseCodes.SUCCESS){
            revert("Failed to mint non-fungible token");
        }

        return serial[0];
    }

    function transferNft(
        address token,
        address receiver, 
        int64 serial
    ) external returns(int){

        int response = HederaTokenService.transferNFT(token, address(this), receiver, serial);

        if(response != HederaResponseCodes.SUCCESS){
            revert("Failed to transfer non-fungible token");
        }

        return response;
    }

}