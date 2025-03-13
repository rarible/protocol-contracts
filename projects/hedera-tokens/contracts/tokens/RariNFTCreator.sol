// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.5.0 <0.9.0;

import "../system-contracts/HederaResponseCodes.sol";
import "../system-contracts/hedera-token-service/IHederaTokenService.sol";
import "../system-contracts/hedera-token-service/HederaTokenService.sol";
import "../system-contracts/hedera-token-service/ExpiryHelper.sol";
import "../system-contracts/hedera-token-service/KeyHelper.sol";
import "hardhat/console.sol";

contract RariNFTCreator is ExpiryHelper, KeyHelper, HederaTokenService {

    struct CreateNftCollectionParams {
        address feeCollector;
        bool isRoyaltyFee;
        bool isFixedFee;
        int64 feeAmount;
        address fixedFeeTokenAddress;
        bool useHbarsForPayment;
        bool useCurrentTokenForPayment;
    }

    event CreatedToken(address tokenAddress);



    mapping(address => string) public baseUri;

    function createNftCollection(string memory name, string memory symbol, string memory memo, int64 maxSupply, int64 autoRenewPeriod) external payable returns (address) {
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

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert("Failed to create non-fungible token");
        }

        emit CreatedToken(createdToken);

        return createdToken;
    }

    function createNonFungibleTokenWithCustomFeesPublic(string memory name, string memory symbol, string memory memo, int64 maxSupply, string memory uri, CreateNftCollectionParams memory params) public payable {
        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](2);
        keys[0] = getSingleKey(KeyType.ADMIN, KeyValueType.INHERIT_ACCOUNT_KEY, bytes(""));
        keys[1] = getSingleKey(KeyType.SUPPLY, KeyValueType.INHERIT_ACCOUNT_KEY, bytes(""));

        IHederaTokenService.Expiry memory expiry = IHederaTokenService.Expiry(0, address(this), 8000000);

        IHederaTokenService.HederaToken memory token = IHederaTokenService.HederaToken(name, symbol, address(this), memo, true, maxSupply, false, keys, expiry);

        IHederaTokenService.FixedFee[] memory fixedFees = new IHederaTokenService.FixedFee[](1);
        if (params.isFixedFee) {
            fixedFees[0] = IHederaTokenService.FixedFee(params.feeAmount, params.fixedFeeTokenAddress, params.useHbarsForPayment, params.useCurrentTokenForPayment, params.feeCollector);
        } else {
            fixedFees = new IHederaTokenService.FixedFee[](0);
        }

        IHederaTokenService.RoyaltyFee[] memory royaltyFees = new IHederaTokenService.RoyaltyFee[](1);
        // upt to 10
        // fee can't ne feeAmount equal to zero
        if (params.isRoyaltyFee) {
            royaltyFees[0] = IHederaTokenService.RoyaltyFee(1, 10, params.feeAmount, params.fixedFeeTokenAddress, params.useHbarsForPayment, params.feeCollector);
        } else {
            royaltyFees = new IHederaTokenService.RoyaltyFee[](0);
        }

        (int responseCode, address tokenAddress) = HederaTokenService.createNonFungibleTokenWithCustomFees(token, fixedFees, royaltyFees);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        baseUri[tokenAddress] = uri;

        emit CreatedToken(tokenAddress);
    }

    // IPFS content identifier (CID) that points to your metadata
    // String CID = ("QmTzWcVfk88JRqjTpVwHzBeULRTNzHY7mnBSG42CpwHmPa") ;
    // .addMetadata(CID.getBytes())
    // function mintNft(address token, bytes[] memory metadata) external returns (int64) {
    //     (int response, , int64[] memory serial) = HederaTokenService.mintToken(token, 0, metadata);

    //     if (response != HederaResponseCodes.SUCCESS) {
    //         revert("Failed to mint non-fungible token");
    //     }

    //     return serial[0];
    // }

    function convertStringToBytes(string memory input) public pure returns (bytes memory) {
        return bytes(input);
    }

    // IPFS content identifier (CID) that points to your metadata
    // String CID = ("QmTzWcVfk88JRqjTpVwHzBeULRTNzHY7mnBSG42CpwHmPa") ;
    // .addMetadata(CID.getBytes())
    function mintNft(address token) external returns (int64) {
        string memory uri = baseUri[token];
        (int responseCode, IHederaTokenService.TokenInfo memory tokenInfo) = HederaTokenService.getTokenInfo(token);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert("Failed to mint non-fungible token");
        }
        int64 totalSupply = tokenInfo.totalSupply;
        string memory tokenUri = string.concat(uri, "/", int64ToString(totalSupply), ".json");
        bytes[] memory metadata = new bytes[](1);
        metadata[0] = bytes(tokenUri);
        (int response, , int64[] memory serial) = HederaTokenService.mintToken(token, 0, metadata);

        if (response != HederaResponseCodes.SUCCESS) {
            revert("Failed to mint non-fungible token");
        }

        return serial[0];
    }

    function mintNftWithMetadata(address token, bytes[] memory metadata) external returns (int64) {

        (int response, , int64[] memory serial) = HederaTokenService.mintToken(token, 0, metadata);

        string memory uri = baseUri[token];
        (int responseCode, IHederaTokenService.TokenInfo memory tokenInfo) = HederaTokenService.getTokenInfo(token);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert("Failed to mint non-fungible token");
        }
        int64 totalSupply = tokenInfo.totalSupply;
        string memory tokenUri = string.concat(uri, "/", int64ToString(totalSupply), ".json");
        bytes[] memory metadatagen = new bytes[](1);

        console.log("tokenUri", tokenUri);

        if (response != HederaResponseCodes.SUCCESS) {
            revert("Failed to mint non-fungible token");
        }

        return serial[0];
    }

    function transferNft(address token, address receiver, int64 serial) external returns (int) {
        int response = HederaTokenService.transferNFT(token, address(this), receiver, serial);

        if (response != HederaResponseCodes.SUCCESS) {
            revert("Failed to transfer non-fungible token");
        }

        return response;
    }

    function int64ToString(int64 value) public pure returns (string memory) {
        // Handle zero explicitly
        if (value == 0) {
            return "0";
        }
        
        // Check if the value is negative
        bool negative = (value < 0);
        
        // In Solidity 0.8+, negating int64(-2^63) will overflow.
        // If you must handle that edge case, you can add a check like:
        // require(value != type(int64).min, "Minimum int64 value not supported");
        // or handle it in a special way.

        // Convert to positive if negative
        uint64 temp = negative ? uint64(-value) : uint64(value);
        
        // Determine the length of the resulting string
        uint256 length;
        uint64 tempCopy = temp;
        while (tempCopy != 0) {
            length++;
            tempCopy /= 10;
        }
        
        // Account for the '-' sign if necessary
        if (negative) {
            length++;
        }
        
        // Prepare a buffer
        bytes memory buffer = new bytes(length);
        
        // Fill the buffer from the end (least significant digit)
        uint256 index = length - 1;
        while (temp != 0) {
            buffer[index] = bytes1(uint8(48 + (temp % 10)));
            temp /= 10;
            if (index > 0) {
                index--;
            }
        }
        
        // If negative, set the first character to '-'
        if (negative) {
            buffer[0] = '-';
        }
        
        return string(buffer);
    }
}
