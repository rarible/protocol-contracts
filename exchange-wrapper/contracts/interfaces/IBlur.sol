// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;


interface IBlur {
    enum Side { Buy, Sell }
    enum SignatureVersion { Single, Bulk }
    enum AssetType { ERC721, ERC1155 }

    struct Fee {
        uint16 rate;
        address payable recipient;
    }
        
    struct Order {
        address trader;
        Side side;
        address matchingPolicy;
        address collection;
        uint256 tokenId;
        uint256 amount;
        address paymentToken;
        uint256 price;
        uint256 listingTime;
        /* Order expiration timestamp - 0 for oracle cancellations. */
        uint256 expirationTime;
        Fee[] fees;
        uint256 salt;
        bytes extraParams;
    }

    struct Input {
        Order order;
        uint8 v;
        bytes32 r;
        bytes32 s;
        bytes extraSignature;
        SignatureVersion signatureVersion;
        uint256 blockNumber;
    }

    function execute(Input calldata sell, Input calldata buy)
        external
        payable;
}
