// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "../../contracts/IMarketWrapper.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol";

contract PartyBidTest is ERC721HolderUpgradeable{
    IMarketWrapper public marketWrapper;

    uint256 public auctionId;

    constructor(
        address _marketWrapper,
        address _nftContract,
        uint256 _tokenId,
        uint256 _auctionId
    ) {
        require(
            IMarketWrapper(_marketWrapper).auctionIdMatchesToken(
                _auctionId,
                _nftContract,
                _tokenId
            ),
            "PartyBid::initialize: auctionId doesn't match token"
        );
        marketWrapper = IMarketWrapper(_marketWrapper);
        auctionId = _auctionId;
    }

    function contribute() external payable {
    }

    function bid() external {
        require(
            address(this) !=
                marketWrapper.getCurrentHighestBidder(
                    auctionId
                ),
            "PartyBid::bid: already highest bidder"
        );
        require(
            !marketWrapper.isFinalized(auctionId),
            "PartyBid::bid: auction already finalized"
        );
        // get the minimum next bid for the auction
        uint256 _bid = marketWrapper.getMinimumBid(auctionId);

        // submit bid to Auction contract using delegatecall
        (bool success, bytes memory returnData) =
            address(marketWrapper).delegatecall(
                abi.encodeWithSignature("bid(uint256,uint256)", auctionId, _bid)
            );
        require(
            success,
            string(
                abi.encodePacked(
                    "PartyBid::bid: place bid failed: ",
                    returnData
                )
            )
        );
    }

    function finalize() external {
        if (!marketWrapper.isFinalized(auctionId)) {
            marketWrapper.finalize(auctionId);
        }
    }
}
