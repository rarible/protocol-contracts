**THIS CHECKLIST IS NOT COMPLETE**. Use `--show-ignored-findings` to show all the results.
Summary
 - [reentrancy-eth](#reentrancy-eth) (6 results) (High)
 - [uninitialized-storage](#uninitialized-storage) (1 results) (High)
 - [uninitialized-local](#uninitialized-local) (5 results) (Medium)
 - [reentrancy-benign](#reentrancy-benign) (5 results) (Low)
 - [reentrancy-events](#reentrancy-events) (3 results) (Low)
 - [timestamp](#timestamp) (2 results) (Low)
 - [assembly](#assembly) (2 results) (Informational)
 - [pragma](#pragma) (1 results) (Informational)
 - [dead-code](#dead-code) (28 results) (Informational)
 - [solc-version](#solc-version) (36 results) (Informational)
 - [low-level-calls](#low-level-calls) (5 results) (Informational)
 - [naming-convention](#naming-convention) (40 results) (Informational)
 - [redundant-statements](#redundant-statements) (1 results) (Informational)
 - [similar-names](#similar-names) (2 results) (Informational)
 - [unused-state](#unused-state) (2 results) (Informational)
## reentrancy-eth
Impact: High
Confidence: Medium
 - [ ] ID-0
Reentrancy in [AuctionHouse721.finishAuction(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L157-L197):
	External calls:
	- [doTransfers(LibDeal.DealSide(getSellAsset(currentAuction.sellToken,currentAuction.sellTokenId,1,LibAsset.ERC721_ASSET_CLASS),getPayouts(currentAuction.seller),getOriginFee(aucData.originFee),proxies[LibAsset.ERC721_ASSET_CLASS],address(this)),LibDeal.DealSide(getBuyAsset(currentAuction.buyAsset,currentAuction.lastBid.amount),getPayouts(currentAuction.buyer),getOriginFee(bidOriginFee),_getProxy(currentAuction.buyAsset),address(this)),LibDeal.DealData(MAX_FEE_BASE_POINT,LibFeeSide.FeeSide.RIGHT))](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L168-L195)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
		- [royaltiesRegistry.getRoyalties(token,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/RaribleTransferManager.sol#L146)
		- [IERC721Upgradeable(token).safeTransferFrom(address(this),to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L45)
		- [INftTransferProxy(proxy).erc721safeTransferFrom(IERC721Upgradeable(token),from,to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L47)
		- [require(bool,string)(IERC20Upgradeable(token_scope_0).transfer(to,asset.value),erc20 transfer failed)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L53)
		- [IERC20TransferProxy(proxy).erc20safeTransferFrom(IERC20Upgradeable(token_scope_0),from,to,asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L55)
		- [IERC1155Upgradeable(token_scope_1).safeTransferFrom(address(this),to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L61)
		- [INftTransferProxy(proxy).erc1155safeTransferFrom(IERC1155Upgradeable(token_scope_1),from,to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L63)
		- [to.transferEth(asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L67)
		- [ITransferProxy(proxy).transfer(asset,from,to)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L70)
	External calls sending eth:
	- [doTransfers(LibDeal.DealSide(getSellAsset(currentAuction.sellToken,currentAuction.sellTokenId,1,LibAsset.ERC721_ASSET_CLASS),getPayouts(currentAuction.seller),getOriginFee(aucData.originFee),proxies[LibAsset.ERC721_ASSET_CLASS],address(this)),LibDeal.DealSide(getBuyAsset(currentAuction.buyAsset,currentAuction.lastBid.amount),getPayouts(currentAuction.buyer),getOriginFee(bidOriginFee),_getProxy(currentAuction.buyAsset),address(this)),LibDeal.DealData(MAX_FEE_BASE_POINT,LibFeeSide.FeeSide.RIGHT))](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L168-L195)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
	State variables written after the call(s):
	- [deactivateAuction(_auctionId,currentAuction.sellToken,currentAuction.sellTokenId)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L196)
		- [delete auctions[_auctionId]](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L208)
	[AuctionHouseBase721.auctions](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouseBase721.sol#L10) can be used in cross function reentrancies:
	- [AuctionHouse721.checkAuctionExistence(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L152-L154)
	- [AuctionHouse721.checkAuctionRangeTime(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L200-L202)
	- [AuctionHouse721.deactivateAuction(uint256,address,uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L205-L209)
	- [AuctionHouse721.getCurrentBuyer(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L315-L317)
	- [AuctionHouse721.getMinimalNextBid(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L146-L149)
	- [AuctionHouse721.putBid(uint256,AuctionHouseBase.Bid)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L83-L143)
	- [AuctionHouse721.putBidWrapper(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L320-L323)
	- [AuctionHouse721.startAuction(address,uint256,address,uint96,bytes4,bytes)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L38-L80)

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L157-L197


 - [ ] ID-1
Reentrancy in [AuctionHouse721.putBid(uint256,AuctionHouseBase.Bid)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L83-L143):
	External calls:
	- [checkEthReturnChange(bid.amount,newBuyer)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L93)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
		- [buyer.transferEth(change)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L241)
	External calls sending eth:
	- [checkEthReturnChange(bid.amount,newBuyer)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L93)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
	State variables written after the call(s):
	- [auctions[_auctionId].endTime = endTime](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L113)
	[AuctionHouseBase721.auctions](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouseBase721.sol#L10) can be used in cross function reentrancies:
	- [AuctionHouse721.checkAuctionExistence(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L152-L154)
	- [AuctionHouse721.checkAuctionRangeTime(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L200-L202)
	- [AuctionHouse721.deactivateAuction(uint256,address,uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L205-L209)
	- [AuctionHouse721.getCurrentBuyer(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L315-L317)
	- [AuctionHouse721.getMinimalNextBid(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L146-L149)
	- [AuctionHouse721.putBid(uint256,AuctionHouseBase.Bid)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L83-L143)
	- [AuctionHouse721.putBidWrapper(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L320-L323)
	- [AuctionHouse721.startAuction(address,uint256,address,uint96,bytes4,bytes)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L38-L80)

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L83-L143


 - [ ] ID-2
Reentrancy in [AuctionHouse721.putBid(uint256,AuctionHouseBase.Bid)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L83-L143):
	External calls:
	- [checkEthReturnChange(bid.amount,newBuyer)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L93)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
		- [buyer.transferEth(change)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L241)
	- [reserveBid(currentAuction.buyAsset,currentAuction.buyer,newBuyer,currentAuction.lastBid,proxy,bid.amount)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L122-L129)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
		- [(success) = oldBuyer.call{value: oldBid.amount}()](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L209)
		- [IERC721Upgradeable(token).safeTransferFrom(address(this),to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L45)
		- [INftTransferProxy(proxy).erc721safeTransferFrom(IERC721Upgradeable(token),from,to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L47)
		- [require(bool,string)(IERC20Upgradeable(token_scope_0).transfer(to,asset.value),erc20 transfer failed)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L53)
		- [IERC20TransferProxy(proxy).erc20safeTransferFrom(IERC20Upgradeable(token_scope_0),from,to,asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L55)
		- [IERC1155Upgradeable(token_scope_1).safeTransferFrom(address(this),to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L61)
		- [INftTransferProxy(proxy).erc1155safeTransferFrom(IERC1155Upgradeable(token_scope_1),from,to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L63)
		- [to.transferEth(asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L67)
		- [ITransferProxy(proxy).transfer(asset,from,to)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L70)
	External calls sending eth:
	- [checkEthReturnChange(bid.amount,newBuyer)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L93)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
	- [reserveBid(currentAuction.buyAsset,currentAuction.buyer,newBuyer,currentAuction.lastBid,proxy,bid.amount)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L122-L129)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
		- [(success) = oldBuyer.call{value: oldBid.amount}()](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L209)
	State variables written after the call(s):
	- [auctions[_auctionId].lastBid = bid](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L130)
	[AuctionHouseBase721.auctions](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouseBase721.sol#L10) can be used in cross function reentrancies:
	- [AuctionHouse721.checkAuctionExistence(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L152-L154)
	- [AuctionHouse721.checkAuctionRangeTime(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L200-L202)
	- [AuctionHouse721.deactivateAuction(uint256,address,uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L205-L209)
	- [AuctionHouse721.getCurrentBuyer(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L315-L317)
	- [AuctionHouse721.getMinimalNextBid(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L146-L149)
	- [AuctionHouse721.putBid(uint256,AuctionHouseBase.Bid)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L83-L143)
	- [AuctionHouse721.putBidWrapper(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L320-L323)
	- [AuctionHouse721.startAuction(address,uint256,address,uint96,bytes4,bytes)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L38-L80)
	- [auctions[_auctionId].buyer = newBuyer](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L131)
	[AuctionHouseBase721.auctions](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouseBase721.sol#L10) can be used in cross function reentrancies:
	- [AuctionHouse721.checkAuctionExistence(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L152-L154)
	- [AuctionHouse721.checkAuctionRangeTime(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L200-L202)
	- [AuctionHouse721.deactivateAuction(uint256,address,uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L205-L209)
	- [AuctionHouse721.getCurrentBuyer(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L315-L317)
	- [AuctionHouse721.getMinimalNextBid(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L146-L149)
	- [AuctionHouse721.putBid(uint256,AuctionHouseBase.Bid)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L83-L143)
	- [AuctionHouse721.putBidWrapper(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L320-L323)
	- [AuctionHouse721.startAuction(address,uint256,address,uint96,bytes4,bytes)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L38-L80)
	- [auctions[_auctionId].endTime = endTime](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L140)
	[AuctionHouseBase721.auctions](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouseBase721.sol#L10) can be used in cross function reentrancies:
	- [AuctionHouse721.checkAuctionExistence(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L152-L154)
	- [AuctionHouse721.checkAuctionRangeTime(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L200-L202)
	- [AuctionHouse721.deactivateAuction(uint256,address,uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L205-L209)
	- [AuctionHouse721.getCurrentBuyer(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L315-L317)
	- [AuctionHouse721.getMinimalNextBid(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L146-L149)
	- [AuctionHouse721.putBid(uint256,AuctionHouseBase.Bid)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L83-L143)
	- [AuctionHouse721.putBidWrapper(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L320-L323)
	- [AuctionHouse721.startAuction(address,uint256,address,uint96,bytes4,bytes)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L38-L80)

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L83-L143


 - [ ] ID-3
Reentrancy in [AuctionHouse721.cancel(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L212-L228):
	External calls:
	- [transferNFT(currentAuction.sellToken,currentAuction.sellTokenId,1,LibAsset.ERC721_ASSET_CLASS,address(this),seller)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L218-L225)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
		- [IERC721Upgradeable(token).safeTransferFrom(address(this),to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L45)
		- [INftTransferProxy(proxy).erc721safeTransferFrom(IERC721Upgradeable(token),from,to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L47)
		- [require(bool,string)(IERC20Upgradeable(token_scope_0).transfer(to,asset.value),erc20 transfer failed)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L53)
		- [IERC20TransferProxy(proxy).erc20safeTransferFrom(IERC20Upgradeable(token_scope_0),from,to,asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L55)
		- [IERC1155Upgradeable(token_scope_1).safeTransferFrom(address(this),to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L61)
		- [INftTransferProxy(proxy).erc1155safeTransferFrom(IERC1155Upgradeable(token_scope_1),from,to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L63)
		- [to.transferEth(asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L67)
		- [ITransferProxy(proxy).transfer(asset,from,to)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L70)
	External calls sending eth:
	- [transferNFT(currentAuction.sellToken,currentAuction.sellTokenId,1,LibAsset.ERC721_ASSET_CLASS,address(this),seller)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L218-L225)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
	State variables written after the call(s):
	- [deactivateAuction(_auctionId,currentAuction.sellToken,currentAuction.sellTokenId)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L226)
		- [delete auctions[_auctionId]](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L208)
	[AuctionHouseBase721.auctions](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouseBase721.sol#L10) can be used in cross function reentrancies:
	- [AuctionHouse721.checkAuctionExistence(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L152-L154)
	- [AuctionHouse721.checkAuctionRangeTime(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L200-L202)
	- [AuctionHouse721.deactivateAuction(uint256,address,uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L205-L209)
	- [AuctionHouse721.getCurrentBuyer(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L315-L317)
	- [AuctionHouse721.getMinimalNextBid(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L146-L149)
	- [AuctionHouse721.putBid(uint256,AuctionHouseBase.Bid)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L83-L143)
	- [AuctionHouse721.putBidWrapper(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L320-L323)
	- [AuctionHouse721.startAuction(address,uint256,address,uint96,bytes4,bytes)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L38-L80)

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L212-L228


 - [ ] ID-4
Reentrancy in [AuctionHouse721.buyOut(uint256,AuctionHouseBase.Bid)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L232-L253):
	External calls:
	- [checkEthReturnChange(bid.amount,sender)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L243)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
		- [buyer.transferEth(change)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L241)
	- [_buyOut(currentAuction,bid,aucData,_auctionId,bidOriginFee,sender)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L245-L252)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
		- [royaltiesRegistry.getRoyalties(token,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/RaribleTransferManager.sol#L146)
		- [(success) = oldBuyer.call{value: oldBid.amount}()](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L209)
		- [IERC721Upgradeable(token).safeTransferFrom(address(this),to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L45)
		- [INftTransferProxy(proxy).erc721safeTransferFrom(IERC721Upgradeable(token),from,to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L47)
		- [require(bool,string)(IERC20Upgradeable(token_scope_0).transfer(to,asset.value),erc20 transfer failed)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L53)
		- [IERC20TransferProxy(proxy).erc20safeTransferFrom(IERC20Upgradeable(token_scope_0),from,to,asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L55)
		- [IERC1155Upgradeable(token_scope_1).safeTransferFrom(address(this),to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L61)
		- [INftTransferProxy(proxy).erc1155safeTransferFrom(IERC1155Upgradeable(token_scope_1),from,to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L63)
		- [to.transferEth(asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L67)
		- [ITransferProxy(proxy).transfer(asset,from,to)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L70)
	External calls sending eth:
	- [checkEthReturnChange(bid.amount,sender)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L243)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
	- [_buyOut(currentAuction,bid,aucData,_auctionId,bidOriginFee,sender)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L245-L252)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
		- [(success) = oldBuyer.call{value: oldBid.amount}()](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L209)
	State variables written after the call(s):
	- [_buyOut(currentAuction,bid,aucData,_auctionId,bidOriginFee,sender)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L245-L252)
		- [delete auctions[_auctionId]](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L208)
	[AuctionHouseBase721.auctions](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouseBase721.sol#L10) can be used in cross function reentrancies:
	- [AuctionHouse721.checkAuctionExistence(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L152-L154)
	- [AuctionHouse721.checkAuctionRangeTime(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L200-L202)
	- [AuctionHouse721.deactivateAuction(uint256,address,uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L205-L209)
	- [AuctionHouse721.getCurrentBuyer(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L315-L317)
	- [AuctionHouse721.getMinimalNextBid(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L146-L149)
	- [AuctionHouse721.putBid(uint256,AuctionHouseBase.Bid)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L83-L143)
	- [AuctionHouse721.putBidWrapper(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L320-L323)
	- [AuctionHouse721.startAuction(address,uint256,address,uint96,bytes4,bytes)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L38-L80)

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L232-L253


 - [ ] ID-5
Reentrancy in [AuctionHouse721.putBid(uint256,AuctionHouseBase.Bid)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L83-L143):
	External calls:
	- [checkEthReturnChange(bid.amount,newBuyer)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L93)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
		- [buyer.transferEth(change)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L241)
	- [_buyOut(currentAuction,bid,aucData,_auctionId,bidOriginFee,newBuyer)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L97-L104)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
		- [royaltiesRegistry.getRoyalties(token,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/RaribleTransferManager.sol#L146)
		- [(success) = oldBuyer.call{value: oldBid.amount}()](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L209)
		- [IERC721Upgradeable(token).safeTransferFrom(address(this),to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L45)
		- [INftTransferProxy(proxy).erc721safeTransferFrom(IERC721Upgradeable(token),from,to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L47)
		- [require(bool,string)(IERC20Upgradeable(token_scope_0).transfer(to,asset.value),erc20 transfer failed)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L53)
		- [IERC20TransferProxy(proxy).erc20safeTransferFrom(IERC20Upgradeable(token_scope_0),from,to,asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L55)
		- [IERC1155Upgradeable(token_scope_1).safeTransferFrom(address(this),to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L61)
		- [INftTransferProxy(proxy).erc1155safeTransferFrom(IERC1155Upgradeable(token_scope_1),from,to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L63)
		- [to.transferEth(asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L67)
		- [ITransferProxy(proxy).transfer(asset,from,to)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L70)
	External calls sending eth:
	- [checkEthReturnChange(bid.amount,newBuyer)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L93)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
	- [_buyOut(currentAuction,bid,aucData,_auctionId,bidOriginFee,newBuyer)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L97-L104)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
		- [(success) = oldBuyer.call{value: oldBid.amount}()](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L209)
	State variables written after the call(s):
	- [_buyOut(currentAuction,bid,aucData,_auctionId,bidOriginFee,newBuyer)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L97-L104)
		- [delete auctions[_auctionId]](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L208)
	[AuctionHouseBase721.auctions](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouseBase721.sol#L10) can be used in cross function reentrancies:
	- [AuctionHouse721.checkAuctionExistence(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L152-L154)
	- [AuctionHouse721.checkAuctionRangeTime(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L200-L202)
	- [AuctionHouse721.deactivateAuction(uint256,address,uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L205-L209)
	- [AuctionHouse721.getCurrentBuyer(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L315-L317)
	- [AuctionHouse721.getMinimalNextBid(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L146-L149)
	- [AuctionHouse721.putBid(uint256,AuctionHouseBase.Bid)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L83-L143)
	- [AuctionHouse721.putBidWrapper(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L320-L323)
	- [AuctionHouse721.startAuction(address,uint256,address,uint96,bytes4,bytes)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L38-L80)

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L83-L143


## uninitialized-storage
Impact: High
Confidence: High
 - [ ] ID-6
[RaribleTransferManager.getRoyaltiesByAssetType(LibAsset.AssetType).data_scope_0](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/RaribleTransferManager.sol#L151) is a storage variable never initialized

https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/RaribleTransferManager.sol#L151


## uninitialized-local
Impact: Medium
Confidence: Medium
 - [ ] ID-7
[RaribleTransferManager.getRoyaltiesByAssetType(LibAsset.AssetType).empty](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/RaribleTransferManager.sol#L154) is a local variable never initialized

https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/RaribleTransferManager.sol#L154


 - [ ] ID-8
[TransferExecutor.transfer(LibAsset.Asset,address,address,address).tokenId_scope_2](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L59) is a local variable never initialized

https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L59


 - [ ] ID-9
[TransferExecutor.transfer(LibAsset.Asset,address,address,address).token_scope_1](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L59) is a local variable never initialized

https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L59


 - [ ] ID-10
[AuctionHouse721.startAuction(address,uint256,address,uint96,bytes4,bytes)._protocolFee](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L48) is a local variable never initialized

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L48


 - [ ] ID-11
[AuctionHouseBase._getProxy(address).proxy](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L228) is a local variable never initialized

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L228


## reentrancy-benign
Impact: Low
Confidence: Medium
 - [ ] ID-12
Reentrancy in [AuctionHouse721._buyOut(AuctionHouseBase721.Auction,AuctionHouseBase.Bid,LibAucDataV1.DataV1,uint256,uint256,address)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L255-L312):
	External calls:
	- [_returnBid(currentAuction.lastBid,currentAuction.buyAsset,currentAuction.buyer,proxy)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L265-L270)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
		- [(success) = oldBuyer.call{value: oldBid.amount}()](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L209)
		- [IERC721Upgradeable(token).safeTransferFrom(address(this),to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L45)
		- [INftTransferProxy(proxy).erc721safeTransferFrom(IERC721Upgradeable(token),from,to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L47)
		- [require(bool,string)(IERC20Upgradeable(token_scope_0).transfer(to,asset.value),erc20 transfer failed)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L53)
		- [IERC20TransferProxy(proxy).erc20safeTransferFrom(IERC20Upgradeable(token_scope_0),from,to,asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L55)
		- [IERC1155Upgradeable(token_scope_1).safeTransferFrom(address(this),to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L61)
		- [INftTransferProxy(proxy).erc1155safeTransferFrom(IERC1155Upgradeable(token_scope_1),from,to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L63)
		- [to.transferEth(asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L67)
		- [ITransferProxy(proxy).transfer(asset,from,to)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L70)
	- [doTransfers(LibDeal.DealSide(getSellAsset(currentAuction.sellToken,currentAuction.sellTokenId,1,LibAsset.ERC721_ASSET_CLASS),getPayouts(currentAuction.seller),getOriginFee(aucData.originFee),proxies[LibAsset.ERC721_ASSET_CLASS],address(this)),LibDeal.DealSide(getBuyAsset(currentAuction.buyAsset,bid.amount),getPayouts(sender),getOriginFee(newBidOriginFee),proxy,from),LibDeal.DealData(MAX_FEE_BASE_POINT,LibFeeSide.FeeSide.RIGHT))](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L281-L308)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
		- [royaltiesRegistry.getRoyalties(token,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/RaribleTransferManager.sol#L146)
		- [IERC721Upgradeable(token).safeTransferFrom(address(this),to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L45)
		- [INftTransferProxy(proxy).erc721safeTransferFrom(IERC721Upgradeable(token),from,to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L47)
		- [require(bool,string)(IERC20Upgradeable(token_scope_0).transfer(to,asset.value),erc20 transfer failed)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L53)
		- [IERC20TransferProxy(proxy).erc20safeTransferFrom(IERC20Upgradeable(token_scope_0),from,to,asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L55)
		- [IERC1155Upgradeable(token_scope_1).safeTransferFrom(address(this),to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L61)
		- [INftTransferProxy(proxy).erc1155safeTransferFrom(IERC1155Upgradeable(token_scope_1),from,to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L63)
		- [to.transferEth(asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L67)
		- [ITransferProxy(proxy).transfer(asset,from,to)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L70)
	External calls sending eth:
	- [_returnBid(currentAuction.lastBid,currentAuction.buyAsset,currentAuction.buyer,proxy)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L265-L270)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
		- [(success) = oldBuyer.call{value: oldBid.amount}()](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L209)
	- [doTransfers(LibDeal.DealSide(getSellAsset(currentAuction.sellToken,currentAuction.sellTokenId,1,LibAsset.ERC721_ASSET_CLASS),getPayouts(currentAuction.seller),getOriginFee(aucData.originFee),proxies[LibAsset.ERC721_ASSET_CLASS],address(this)),LibDeal.DealSide(getBuyAsset(currentAuction.buyAsset,bid.amount),getPayouts(sender),getOriginFee(newBidOriginFee),proxy,from),LibDeal.DealData(MAX_FEE_BASE_POINT,LibFeeSide.FeeSide.RIGHT))](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L281-L308)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
	State variables written after the call(s):
	- [deactivateAuction(_auctionId,currentAuction.sellToken,currentAuction.sellTokenId)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L310)
		- [delete auctions[_auctionId]](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L208)
	- [deactivateAuction(_auctionId,currentAuction.sellToken,currentAuction.sellTokenId)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L310)
		- [delete tokenToAuctionId[token][tokenId]](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/wrapper/TokenToAuction.sol#L21)

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L255-L312


 - [ ] ID-13
Reentrancy in [AuctionHouse721.finishAuction(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L157-L197):
	External calls:
	- [doTransfers(LibDeal.DealSide(getSellAsset(currentAuction.sellToken,currentAuction.sellTokenId,1,LibAsset.ERC721_ASSET_CLASS),getPayouts(currentAuction.seller),getOriginFee(aucData.originFee),proxies[LibAsset.ERC721_ASSET_CLASS],address(this)),LibDeal.DealSide(getBuyAsset(currentAuction.buyAsset,currentAuction.lastBid.amount),getPayouts(currentAuction.buyer),getOriginFee(bidOriginFee),_getProxy(currentAuction.buyAsset),address(this)),LibDeal.DealData(MAX_FEE_BASE_POINT,LibFeeSide.FeeSide.RIGHT))](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L168-L195)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
		- [royaltiesRegistry.getRoyalties(token,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/RaribleTransferManager.sol#L146)
		- [IERC721Upgradeable(token).safeTransferFrom(address(this),to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L45)
		- [INftTransferProxy(proxy).erc721safeTransferFrom(IERC721Upgradeable(token),from,to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L47)
		- [require(bool,string)(IERC20Upgradeable(token_scope_0).transfer(to,asset.value),erc20 transfer failed)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L53)
		- [IERC20TransferProxy(proxy).erc20safeTransferFrom(IERC20Upgradeable(token_scope_0),from,to,asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L55)
		- [IERC1155Upgradeable(token_scope_1).safeTransferFrom(address(this),to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L61)
		- [INftTransferProxy(proxy).erc1155safeTransferFrom(IERC1155Upgradeable(token_scope_1),from,to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L63)
		- [to.transferEth(asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L67)
		- [ITransferProxy(proxy).transfer(asset,from,to)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L70)
	External calls sending eth:
	- [doTransfers(LibDeal.DealSide(getSellAsset(currentAuction.sellToken,currentAuction.sellTokenId,1,LibAsset.ERC721_ASSET_CLASS),getPayouts(currentAuction.seller),getOriginFee(aucData.originFee),proxies[LibAsset.ERC721_ASSET_CLASS],address(this)),LibDeal.DealSide(getBuyAsset(currentAuction.buyAsset,currentAuction.lastBid.amount),getPayouts(currentAuction.buyer),getOriginFee(bidOriginFee),_getProxy(currentAuction.buyAsset),address(this)),LibDeal.DealData(MAX_FEE_BASE_POINT,LibFeeSide.FeeSide.RIGHT))](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L168-L195)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
	State variables written after the call(s):
	- [deactivateAuction(_auctionId,currentAuction.sellToken,currentAuction.sellTokenId)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L196)
		- [delete tokenToAuctionId[token][tokenId]](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/wrapper/TokenToAuction.sol#L21)

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L157-L197


 - [ ] ID-14
Reentrancy in [AuctionHouse721.cancel(uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L212-L228):
	External calls:
	- [transferNFT(currentAuction.sellToken,currentAuction.sellTokenId,1,LibAsset.ERC721_ASSET_CLASS,address(this),seller)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L218-L225)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
		- [IERC721Upgradeable(token).safeTransferFrom(address(this),to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L45)
		- [INftTransferProxy(proxy).erc721safeTransferFrom(IERC721Upgradeable(token),from,to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L47)
		- [require(bool,string)(IERC20Upgradeable(token_scope_0).transfer(to,asset.value),erc20 transfer failed)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L53)
		- [IERC20TransferProxy(proxy).erc20safeTransferFrom(IERC20Upgradeable(token_scope_0),from,to,asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L55)
		- [IERC1155Upgradeable(token_scope_1).safeTransferFrom(address(this),to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L61)
		- [INftTransferProxy(proxy).erc1155safeTransferFrom(IERC1155Upgradeable(token_scope_1),from,to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L63)
		- [to.transferEth(asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L67)
		- [ITransferProxy(proxy).transfer(asset,from,to)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L70)
	External calls sending eth:
	- [transferNFT(currentAuction.sellToken,currentAuction.sellTokenId,1,LibAsset.ERC721_ASSET_CLASS,address(this),seller)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L218-L225)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
	State variables written after the call(s):
	- [deactivateAuction(_auctionId,currentAuction.sellToken,currentAuction.sellTokenId)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L226)
		- [delete tokenToAuctionId[token][tokenId]](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/wrapper/TokenToAuction.sol#L21)

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L212-L228


 - [ ] ID-15
Reentrancy in [AuctionHouseBase._returnBid(AuctionHouseBase.Bid,address,address,address)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L198-L225):
	External calls:
	- [(success) = oldBuyer.call{value: oldBid.amount}()](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L209)
	State variables written after the call(s):
	- [readyToWithdraw[oldBuyer] = newValueToWithdraw](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L213)

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L198-L225


 - [ ] ID-16
Reentrancy in [AuctionHouse721.startAuction(address,uint256,address,uint96,bytes4,bytes)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L38-L80):
	External calls:
	- [transferNFT(_sellToken,_sellTokenId,1,LibAsset.ERC721_ASSET_CLASS,sender,address(this))](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L69-L76)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
		- [IERC721Upgradeable(token).safeTransferFrom(address(this),to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L45)
		- [INftTransferProxy(proxy).erc721safeTransferFrom(IERC721Upgradeable(token),from,to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L47)
		- [require(bool,string)(IERC20Upgradeable(token_scope_0).transfer(to,asset.value),erc20 transfer failed)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L53)
		- [IERC20TransferProxy(proxy).erc20safeTransferFrom(IERC20Upgradeable(token_scope_0),from,to,asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L55)
		- [IERC1155Upgradeable(token_scope_1).safeTransferFrom(address(this),to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L61)
		- [INftTransferProxy(proxy).erc1155safeTransferFrom(IERC1155Upgradeable(token_scope_1),from,to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L63)
		- [to.transferEth(asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L67)
		- [ITransferProxy(proxy).transfer(asset,from,to)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L70)
	External calls sending eth:
	- [transferNFT(_sellToken,_sellTokenId,1,LibAsset.ERC721_ASSET_CLASS,sender,address(this))](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L69-L76)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
	State variables written after the call(s):
	- [setAuctionForToken(_sellToken,_sellTokenId,currentAuctionId)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L77)
		- [tokenToAuctionId[token][tokenId] = auctionId](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/wrapper/TokenToAuction.sol#L16)

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L38-L80


## reentrancy-events
Impact: Low
Confidence: Medium
 - [ ] ID-17
Reentrancy in [AuctionHouse721.startAuction(address,uint256,address,uint96,bytes4,bytes)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L38-L80):
	External calls:
	- [transferNFT(_sellToken,_sellTokenId,1,LibAsset.ERC721_ASSET_CLASS,sender,address(this))](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L69-L76)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
		- [IERC721Upgradeable(token).safeTransferFrom(address(this),to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L45)
		- [INftTransferProxy(proxy).erc721safeTransferFrom(IERC721Upgradeable(token),from,to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L47)
		- [require(bool,string)(IERC20Upgradeable(token_scope_0).transfer(to,asset.value),erc20 transfer failed)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L53)
		- [IERC20TransferProxy(proxy).erc20safeTransferFrom(IERC20Upgradeable(token_scope_0),from,to,asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L55)
		- [IERC1155Upgradeable(token_scope_1).safeTransferFrom(address(this),to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L61)
		- [INftTransferProxy(proxy).erc1155safeTransferFrom(IERC1155Upgradeable(token_scope_1),from,to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L63)
		- [to.transferEth(asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L67)
		- [ITransferProxy(proxy).transfer(asset,from,to)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L70)
	External calls sending eth:
	- [transferNFT(_sellToken,_sellTokenId,1,LibAsset.ERC721_ASSET_CLASS,sender,address(this))](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L69-L76)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
	Event emitted after the call(s):
	- [AuctionCreated(currentAuctionId,sender)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L79)

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L38-L80


 - [ ] ID-18
Reentrancy in [AuctionHouseBase._returnBid(AuctionHouseBase.Bid,address,address,address)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L198-L225):
	External calls:
	- [(success) = oldBuyer.call{value: oldBid.amount}()](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L209)
	Event emitted after the call(s):
	- [AvailableToWithdraw(oldBuyer,oldBid.amount,newValueToWithdraw)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L214)

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L198-L225


 - [ ] ID-19
Reentrancy in [AuctionHouse721._buyOut(AuctionHouseBase721.Auction,AuctionHouseBase.Bid,LibAucDataV1.DataV1,uint256,uint256,address)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L255-L312):
	External calls:
	- [_returnBid(currentAuction.lastBid,currentAuction.buyAsset,currentAuction.buyer,proxy)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L265-L270)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
		- [(success) = oldBuyer.call{value: oldBid.amount}()](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L209)
		- [IERC721Upgradeable(token).safeTransferFrom(address(this),to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L45)
		- [INftTransferProxy(proxy).erc721safeTransferFrom(IERC721Upgradeable(token),from,to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L47)
		- [require(bool,string)(IERC20Upgradeable(token_scope_0).transfer(to,asset.value),erc20 transfer failed)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L53)
		- [IERC20TransferProxy(proxy).erc20safeTransferFrom(IERC20Upgradeable(token_scope_0),from,to,asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L55)
		- [IERC1155Upgradeable(token_scope_1).safeTransferFrom(address(this),to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L61)
		- [INftTransferProxy(proxy).erc1155safeTransferFrom(IERC1155Upgradeable(token_scope_1),from,to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L63)
		- [to.transferEth(asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L67)
		- [ITransferProxy(proxy).transfer(asset,from,to)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L70)
	- [doTransfers(LibDeal.DealSide(getSellAsset(currentAuction.sellToken,currentAuction.sellTokenId,1,LibAsset.ERC721_ASSET_CLASS),getPayouts(currentAuction.seller),getOriginFee(aucData.originFee),proxies[LibAsset.ERC721_ASSET_CLASS],address(this)),LibDeal.DealSide(getBuyAsset(currentAuction.buyAsset,bid.amount),getPayouts(sender),getOriginFee(newBidOriginFee),proxy,from),LibDeal.DealData(MAX_FEE_BASE_POINT,LibFeeSide.FeeSide.RIGHT))](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L281-L308)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
		- [royaltiesRegistry.getRoyalties(token,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/RaribleTransferManager.sol#L146)
		- [IERC721Upgradeable(token).safeTransferFrom(address(this),to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L45)
		- [INftTransferProxy(proxy).erc721safeTransferFrom(IERC721Upgradeable(token),from,to,tokenId)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L47)
		- [require(bool,string)(IERC20Upgradeable(token_scope_0).transfer(to,asset.value),erc20 transfer failed)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L53)
		- [IERC20TransferProxy(proxy).erc20safeTransferFrom(IERC20Upgradeable(token_scope_0),from,to,asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L55)
		- [IERC1155Upgradeable(token_scope_1).safeTransferFrom(address(this),to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L61)
		- [INftTransferProxy(proxy).erc1155safeTransferFrom(IERC1155Upgradeable(token_scope_1),from,to,tokenId_scope_2,asset.value,)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L63)
		- [to.transferEth(asset.value)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L67)
		- [ITransferProxy(proxy).transfer(asset,from,to)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L70)
	External calls sending eth:
	- [_returnBid(currentAuction.lastBid,currentAuction.buyAsset,currentAuction.buyer,proxy)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L265-L270)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
		- [(success) = oldBuyer.call{value: oldBid.amount}()](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L209)
	- [doTransfers(LibDeal.DealSide(getSellAsset(currentAuction.sellToken,currentAuction.sellTokenId,1,LibAsset.ERC721_ASSET_CLASS),getPayouts(currentAuction.seller),getOriginFee(aucData.originFee),proxies[LibAsset.ERC721_ASSET_CLASS],address(this)),LibDeal.DealSide(getBuyAsset(currentAuction.buyAsset,bid.amount),getPayouts(sender),getOriginFee(newBidOriginFee),proxy,from),LibDeal.DealData(MAX_FEE_BASE_POINT,LibFeeSide.FeeSide.RIGHT))](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L281-L308)
		- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)
	Event emitted after the call(s):
	- [AuctionBuyOut(auctionId,sender)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L311)
	- [AuctionFinished(_auctionId)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L206)
		- [deactivateAuction(_auctionId,currentAuction.sellToken,currentAuction.sellTokenId)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L310)

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L255-L312


## timestamp
Impact: Low
Confidence: Medium
 - [ ] ID-20
[AuctionHouse721.putBid(uint256,AuctionHouseBase.Bid)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L83-L143) uses timestamp for comparisons
	Dangerous comparisons:
	- [endTime.sub(currentTime) < extension](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L138)

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L83-L143


 - [ ] ID-21
[AuctionHouseBase._checkAuctionRangeTime(uint256,uint256)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L164-L174) uses timestamp for comparisons
	Dangerous comparisons:
	- [startTime > 0 && startTime > currentTime](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L166)
	- [endTime > 0 && endTime <= currentTime](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L169)

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L164-L174


## assembly
Impact: Informational
Confidence: High
 - [ ] ID-22
[AddressUpgradeable.isContract(address)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L26-L35) uses assembly
	- [INLINE ASM](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L33)

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L26-L35


 - [ ] ID-23
[AddressUpgradeable._verifyCallResult(bool,bytes,string)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L147-L164) uses assembly
	- [INLINE ASM](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L156-L159)

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L147-L164


## pragma
Impact: Informational
Confidence: High
 - [ ] ID-24
Different versions of Solidity are used:
	- Version used: ['0.7.6', '>=0.4.24<0.8.0', '>=0.6.0<0.8.0', '>=0.6.2<0.8.0', '>=0.6.9<0.8.0']
	- [0.7.6](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L3)
	- [0.7.6](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouseBase721.sol#L3)
	- [0.7.6](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L3)
	- [0.7.6](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/libs/LibAucDataV1.sol#L3)
	- [0.7.6](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/libs/LibBidDataV1.sol#L3)
	- [0.7.6](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/wrapper/TokenToAuction.sol#L2)
	- [0.7.6](https://github.com/rarible/protocol-contracts/blob/master/@rarible/lib-asset/contracts/LibAsset.sol#L3)
	- [0.7.6](https://github.com/rarible/protocol-contracts/blob/master/@rarible/lib-bp/contracts/BpLibrary.sol#L3)
	- [0.7.6](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/RaribleTransferManager.sol#L3)
	- [0.7.6](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L3)
	- [0.7.6](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/interfaces/ITransferExecutor.sol#L3)
	- [0.7.6](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/interfaces/ITransferManager.sol#L3)
	- [0.7.6](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibDeal.sol#L3)
	- [0.7.6](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibFeeSide.sol#L3)
	- [0.7.6](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L3)
	- [>=0.4.24<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/proxy/Initializable.sol#L4)
	- [>=0.6.0<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/libs/SafeMathUpgradeable96.sol#L3)
	- [>=0.6.0<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/introspection/IERC165Upgradeable.sol#L3)
	- [>=0.6.0<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol#L3)
	- [>=0.6.0<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L3)
	- [>=0.6.2<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol#L3)
	- [>=0.6.2<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol#L3)
	- [>=0.6.2<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L3)
	- [>=0.6.2<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@rarible/exchange-interfaces/contracts/IRoyaltiesProvider.sol#L3)
	- [>=0.6.2<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@rarible/lazy-mint/contracts/erc-1155/LibERC1155LazyMint.sol#L3)
	- [>=0.6.2<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol#L3)
	- [>=0.6.2<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@rarible/lib-part/contracts/LibPart.sol#L3)
	- [>=0.6.9<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@rarible/exchange-interfaces/contracts/IERC20TransferProxy.sol#L3)
	- [>=0.6.9<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@rarible/exchange-interfaces/contracts/INftTransferProxy.sol#L3)
	- [>=0.6.9<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@rarible/exchange-interfaces/contracts/ITransferProxy.sol#L3)
	- [v2](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L4)
	- [v2](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L4)
	- [v2](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/libs/LibAucDataV1.sol#L4)
	- [v2](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/libs/LibBidDataV1.sol#L4)
	- [v2](https://github.com/rarible/protocol-contracts/blob/master/@rarible/exchange-interfaces/contracts/IERC20TransferProxy.sol#L4)
	- [v2](https://github.com/rarible/protocol-contracts/blob/master/@rarible/exchange-interfaces/contracts/INftTransferProxy.sol#L4)
	- [v2](https://github.com/rarible/protocol-contracts/blob/master/@rarible/exchange-interfaces/contracts/IRoyaltiesProvider.sol#L4)
	- [v2](https://github.com/rarible/protocol-contracts/blob/master/@rarible/exchange-interfaces/contracts/ITransferProxy.sol#L4)
	- [v2](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/RaribleTransferManager.sol#L4)
	- [v2](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L4)
	- [v2](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/interfaces/ITransferExecutor.sol#L4)
	- [v2](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/interfaces/ITransferManager.sol#L4)
	- [v2](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibDeal.sol#L4)

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L3


## dead-code
Impact: Informational
Confidence: Medium
 - [ ] ID-25
[SafeMathUpgradeable.sub(uint256,uint256,string)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L170-L173) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L170-L173


 - [ ] ID-26
[ContextUpgradeable._msgData()](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L27-L30) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L27-L30


 - [ ] ID-27
[AddressUpgradeable.functionCallWithValue(address,bytes,uint256)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L104-L106) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L104-L106


 - [ ] ID-28
[LibAsset.hash(LibAsset.Asset)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/lib-asset/contracts/LibAsset.sol#L39-L45) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@rarible/lib-asset/contracts/LibAsset.sol#L39-L45


 - [ ] ID-29
[SafeMathUpgradeable.trySub(uint256,uint256)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L35-L38) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L35-L38


 - [ ] ID-30
[AddressUpgradeable._verifyCallResult(bool,bytes,string)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L147-L164) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L147-L164


 - [ ] ID-31
[SafeMathUpgradeable.div(uint256,uint256,string)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L190-L193) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L190-L193


 - [ ] ID-32
[AddressUpgradeable.functionCall(address,bytes)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L79-L81) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L79-L81


 - [ ] ID-33
[AddressUpgradeable.functionCall(address,bytes,string)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L89-L91) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L89-L91


 - [ ] ID-34
[AddressUpgradeable.sendValue(address,uint256)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L53-L59) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L53-L59


 - [ ] ID-35
[SafeMathUpgradeable.tryMul(uint256,uint256)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L45-L53) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L45-L53


 - [ ] ID-36
[ERC721HolderUpgradeable.__ERC721Holder_init()](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol#L15-L17) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol#L15-L17


 - [ ] ID-37
[ReentrancyGuardUpgradeable.__ReentrancyGuard_init()](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L39-L41) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L39-L41


 - [ ] ID-38
[AddressUpgradeable.functionStaticCall(address,bytes)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L129-L131) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L129-L131


 - [ ] ID-39
[OwnableUpgradeable.__Ownable_init()](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L27-L30) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L27-L30


 - [ ] ID-40
[SafeMathUpgradeable.mod(uint256,uint256,string)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L210-L213) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L210-L213


 - [ ] ID-41
[LibPart.hash(LibPart.Part)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/lib-part/contracts/LibPart.sol#L13-L15) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@rarible/lib-part/contracts/LibPart.sol#L13-L15


 - [ ] ID-42
[LibFeeSide.getFeeSide(bytes4,bytes4)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibFeeSide.sol#L11-L31) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibFeeSide.sol#L11-L31


 - [ ] ID-43
[LibAsset.hash(LibAsset.AssetType)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/lib-asset/contracts/LibAsset.sol#L31-L37) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@rarible/lib-asset/contracts/LibAsset.sol#L31-L37


 - [ ] ID-44
[SafeMathUpgradeable.tryAdd(uint256,uint256)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L24-L28) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L24-L28


 - [ ] ID-45
[LibERC721LazyMint.hash(LibERC721LazyMint.Mint721Data)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol#L21-L37) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol#L21-L37


 - [ ] ID-46
[LibERC1155LazyMint.hash(LibERC1155LazyMint.Mint1155Data)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/lazy-mint/contracts/erc-1155/LibERC1155LazyMint.sol#L22-L39) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@rarible/lazy-mint/contracts/erc-1155/LibERC1155LazyMint.sol#L22-L39


 - [ ] ID-47
[AddressUpgradeable.functionStaticCall(address,bytes,string)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L139-L145) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L139-L145


 - [ ] ID-48
[SafeMathUpgradeable.tryDiv(uint256,uint256)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L60-L63) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L60-L63


 - [ ] ID-49
[SafeMathUpgradeable.mod(uint256,uint256)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L152-L155) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L152-L155


 - [ ] ID-50
[SafeMathUpgradeable.tryMod(uint256,uint256)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L70-L73) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L70-L73


 - [ ] ID-51
[ContextUpgradeable.__Context_init()](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L17-L19) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L17-L19


 - [ ] ID-52
[AddressUpgradeable.functionCallWithValue(address,bytes,uint256,string)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L114-L121) is never used and should be removed

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L114-L121


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-53
Pragma version[>=0.6.2<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@rarible/lib-part/contracts/LibPart.sol#L3) is too complex

https://github.com/rarible/protocol-contracts/blob/master/@rarible/lib-part/contracts/LibPart.sol#L3


 - [ ] ID-54
Pragma version[>=0.6.0<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L3) is too complex

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L3


 - [ ] ID-55
Pragma version[>=0.6.0<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol#L3) is too complex

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol#L3


 - [ ] ID-56
Pragma version[>=0.6.9<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@rarible/exchange-interfaces/contracts/ITransferProxy.sol#L3) is too complex

https://github.com/rarible/protocol-contracts/blob/master/@rarible/exchange-interfaces/contracts/ITransferProxy.sol#L3


 - [ ] ID-57
Pragma version[0.7.6](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibDeal.sol#L3) allows old versions

https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibDeal.sol#L3


 - [ ] ID-58
Pragma version[>=0.6.0<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/libs/SafeMathUpgradeable96.sol#L3) is too complex

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/libs/SafeMathUpgradeable96.sol#L3


 - [ ] ID-59
Pragma version[0.7.6](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/wrapper/TokenToAuction.sol#L2) allows old versions

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/wrapper/TokenToAuction.sol#L2


 - [ ] ID-60
Pragma version[0.7.6](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L3) allows old versions

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L3


 - [ ] ID-61
Pragma version[0.7.6](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouseBase721.sol#L3) allows old versions

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouseBase721.sol#L3


 - [ ] ID-62
Pragma version[>=0.6.0<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L3) is too complex

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L3


 - [ ] ID-63
Pragma version[0.7.6](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/RaribleTransferManager.sol#L3) allows old versions

https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/RaribleTransferManager.sol#L3


 - [ ] ID-64
Pragma version[>=0.6.2<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@rarible/lazy-mint/contracts/erc-1155/LibERC1155LazyMint.sol#L3) is too complex

https://github.com/rarible/protocol-contracts/blob/master/@rarible/lazy-mint/contracts/erc-1155/LibERC1155LazyMint.sol#L3


 - [ ] ID-65
Pragma version[0.7.6](https://github.com/rarible/protocol-contracts/blob/master/@rarible/lib-bp/contracts/BpLibrary.sol#L3) allows old versions

https://github.com/rarible/protocol-contracts/blob/master/@rarible/lib-bp/contracts/BpLibrary.sol#L3


 - [ ] ID-66
Pragma version[>=0.6.0<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/introspection/IERC165Upgradeable.sol#L3) is too complex

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/introspection/IERC165Upgradeable.sol#L3


 - [ ] ID-67
Pragma version[0.7.6](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L3) allows old versions

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L3


 - [ ] ID-68
Pragma version[>=0.4.24<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/proxy/Initializable.sol#L4) is too complex

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/proxy/Initializable.sol#L4


 - [ ] ID-69
Pragma version[0.7.6](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/interfaces/ITransferManager.sol#L3) allows old versions

https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/interfaces/ITransferManager.sol#L3


 - [ ] ID-70
Pragma version[>=0.6.2<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@rarible/exchange-interfaces/contracts/IRoyaltiesProvider.sol#L3) is too complex

https://github.com/rarible/protocol-contracts/blob/master/@rarible/exchange-interfaces/contracts/IRoyaltiesProvider.sol#L3


 - [ ] ID-71
Pragma version[>=0.6.0<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L3) is too complex

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L3


 - [ ] ID-72
Pragma version[0.7.6](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/interfaces/ITransferExecutor.sol#L3) allows old versions

https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/interfaces/ITransferExecutor.sol#L3


 - [ ] ID-73
Pragma version[>=0.6.0<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L3) is too complex

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L3


 - [ ] ID-74
Pragma version[0.7.6](https://github.com/rarible/protocol-contracts/blob/master/@rarible/lib-asset/contracts/LibAsset.sol#L3) allows old versions

https://github.com/rarible/protocol-contracts/blob/master/@rarible/lib-asset/contracts/LibAsset.sol#L3


 - [ ] ID-75
Pragma version[0.7.6](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/libs/LibBidDataV1.sol#L3) allows old versions

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/libs/LibBidDataV1.sol#L3


 - [ ] ID-76
Pragma version[>=0.6.9<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@rarible/exchange-interfaces/contracts/IERC20TransferProxy.sol#L3) is too complex

https://github.com/rarible/protocol-contracts/blob/master/@rarible/exchange-interfaces/contracts/IERC20TransferProxy.sol#L3


 - [ ] ID-77
Pragma version[>=0.6.2<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol#L3) is too complex

https://github.com/rarible/protocol-contracts/blob/master/@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol#L3


 - [ ] ID-78
Pragma version[>=0.6.0<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol#L3) is too complex

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol#L3


 - [ ] ID-79
Pragma version[>=0.6.9<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@rarible/exchange-interfaces/contracts/INftTransferProxy.sol#L3) is too complex

https://github.com/rarible/protocol-contracts/blob/master/@rarible/exchange-interfaces/contracts/INftTransferProxy.sol#L3


 - [ ] ID-80
Pragma version[0.7.6](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L3) allows old versions

https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L3


 - [ ] ID-81
Pragma version[>=0.6.2<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol#L3) is too complex

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol#L3


 - [ ] ID-82
Pragma version[0.7.6](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L3) allows old versions

https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L3


 - [ ] ID-83
Pragma version[>=0.6.0<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol#L3) is too complex

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol#L3


 - [ ] ID-84
Pragma version[0.7.6](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibFeeSide.sol#L3) allows old versions

https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibFeeSide.sol#L3


 - [ ] ID-85
Pragma version[>=0.6.2<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol#L3) is too complex

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol#L3


 - [ ] ID-86
solc-0.7.6 is not recommended for deployment

 - [ ] ID-87
Pragma version[>=0.6.2<0.8.0](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L3) is too complex

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L3


 - [ ] ID-88
Pragma version[0.7.6](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/libs/LibAucDataV1.sol#L3) allows old versions

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/libs/LibAucDataV1.sol#L3


## low-level-calls
Impact: Informational
Confidence: High
 - [ ] ID-89
Low level call in [AddressUpgradeable.functionStaticCall(address,bytes,string)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L139-L145):
	- [(success,returndata) = target.staticcall(data)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L143)

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L139-L145


 - [ ] ID-90
Low level call in [AddressUpgradeable.sendValue(address,uint256)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L53-L59):
	- [(success) = recipient.call{value: amount}()](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L57)

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L53-L59


 - [ ] ID-91
Low level call in [LibTransfer.transferEth(address,uint256)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L6-L9):
	- [(success) = to.call{value: value}()](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L7)

https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/lib/LibTransfer.sol#L6-L9


 - [ ] ID-92
Low level call in [AddressUpgradeable.functionCallWithValue(address,bytes,uint256,string)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L114-L121):
	- [(success,returndata) = target.call{value: value}(data)](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L119)

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L114-L121


 - [ ] ID-93
Low level call in [AuctionHouseBase._returnBid(AuctionHouseBase.Bid,address,address,address)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L198-L225):
	- [(success) = oldBuyer.call{value: oldBid.amount}()](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L209)

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L198-L225


## naming-convention
Impact: Informational
Confidence: High
 - [ ] ID-94
Parameter [AuctionHouse721.getCurrentBuyer(uint256)._auctionId](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L315) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L315


 - [ ] ID-95
Variable [TokenToAuction.______gap](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/wrapper/TokenToAuction.sol#L24) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/wrapper/TokenToAuction.sol#L24


 - [ ] ID-96
Variable [ERC721HolderUpgradeable.__gap](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol#L30) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol#L30


 - [ ] ID-97
Parameter [AuctionHouse721.deactivateAuction(uint256,address,uint256)._auctionId](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L205) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L205


 - [ ] ID-98
Parameter [AuctionHouse721.finishAuction(uint256)._auctionId](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L157) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L157


 - [ ] ID-99
Parameter [AuctionHouseBase.withdrawFaultyBid(address)._to](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L190) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L190


 - [ ] ID-100
Variable [ContextUpgradeable.__gap](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L31) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L31


 - [ ] ID-101
Function [ERC721HolderUpgradeable.__ERC721Holder_init()](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol#L15-L17) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol#L15-L17


 - [ ] ID-102
Parameter [AuctionHouse721.putBid(uint256,AuctionHouseBase.Bid)._auctionId](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L83) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L83


 - [ ] ID-103
Function [ReentrancyGuardUpgradeable.__ReentrancyGuard_init_unchained()](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L43-L45) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L43-L45


 - [ ] ID-104
Parameter [AuctionHouse721.checkAuctionExistence(uint256)._auctionId](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L152) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L152


 - [ ] ID-105
Parameter [AuctionHouse721.startAuction(address,uint256,address,uint96,bytes4,bytes)._sellToken](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L39) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L39


 - [ ] ID-106
Variable [TransferExecutor.__gap](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L74) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L74


 - [ ] ID-107
Function [OwnableUpgradeable.__Ownable_init()](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L27-L30) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L27-L30


 - [ ] ID-108
Variable [OwnableUpgradeable.__gap](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L74) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L74


 - [ ] ID-109
Parameter [AuctionHouse721.getMinimalNextBid(uint256)._auctionId](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L146) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L146


 - [ ] ID-110
Function [AuctionHouseBase.__AuctionHouseBase_init_unchained(uint96)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L71-L77) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L71-L77


 - [ ] ID-111
Variable [AuctionHouseBase.______gap](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L290) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L290


 - [ ] ID-112
Variable [RaribleTransferManager.__gap](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/RaribleTransferManager.sol#L260) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/RaribleTransferManager.sol#L260


 - [ ] ID-113
Parameter [AuctionHouse721.__AuctionHouse721_init(address,IRoyaltiesProvider,address,address,uint64,uint96)._minimalStepBasePoint](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L22) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L22


 - [ ] ID-114
Function [RaribleTransferManager.__RaribleTransferManager_init_unchained(uint256,address,IRoyaltiesProvider)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/RaribleTransferManager.sol#L30-L38) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/RaribleTransferManager.sol#L30-L38


 - [ ] ID-115
Function [ERC721HolderUpgradeable.__ERC721Holder_init_unchained()](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol#L19-L20) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/token/ERC721/ERC721HolderUpgradeable.sol#L19-L20


 - [ ] ID-116
Function [ReentrancyGuardUpgradeable.__ReentrancyGuard_init()](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L39-L41) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L39-L41


 - [ ] ID-117
Parameter [TokenToAuction.getAuctionByToken(address,uint256)._collection](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/wrapper/TokenToAuction.sol#L10) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/wrapper/TokenToAuction.sol#L10


 - [ ] ID-118
Parameter [AuctionHouse721.checkAuctionRangeTime(uint256)._auctionId](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L200) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L200


 - [ ] ID-119
Function [ContextUpgradeable.__Context_init_unchained()](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L21-L22) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L21-L22


 - [ ] ID-120
Parameter [AuctionHouse721.__AuctionHouse721_init(address,IRoyaltiesProvider,address,address,uint64,uint96)._transferProxy](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L19) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L19


 - [ ] ID-121
Parameter [AuctionHouse721.buyOut(uint256,AuctionHouseBase.Bid)._auctionId](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L232) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L232


 - [ ] ID-122
Variable [ReentrancyGuardUpgradeable.__gap](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L67) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol#L67


 - [ ] ID-123
Parameter [AuctionHouse721.startAuction(address,uint256,address,uint96,bytes4,bytes)._buyAsset](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L41) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L41


 - [ ] ID-124
Parameter [AuctionHouse721.__AuctionHouse721_init(address,IRoyaltiesProvider,address,address,uint64,uint96)._erc20TransferProxy](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L20) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L20


 - [ ] ID-125
Parameter [AuctionHouse721.putBidWrapper(uint256)._auctionId](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L320) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L320


 - [ ] ID-126
Function [OwnableUpgradeable.__Ownable_init_unchained()](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L32-L36) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L32-L36


 - [ ] ID-127
Parameter [AuctionHouse721.cancel(uint256)._auctionId](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L212) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L212


 - [ ] ID-128
Function [AuctionHouse721.__AuctionHouse721_init(address,IRoyaltiesProvider,address,address,uint64,uint96)](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L16-L32) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L16-L32


 - [ ] ID-129
Parameter [AuctionHouse721.startAuction(address,uint256,address,uint96,bytes4,bytes)._sellTokenId](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L40) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L40


 - [ ] ID-130
Function [AuctionHouse721.__AuctionHouse721_init_unchained()](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L34-L35) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/721/AuctionHouse721.sol#L34-L35


 - [ ] ID-131
Function [ContextUpgradeable.__Context_init()](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L17-L19) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L17-L19


 - [ ] ID-132
Parameter [AuctionHouseBase.__AuctionHouseBase_init_unchained(uint96)._minimalStepBasePoint](https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L72) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/auction/contracts/AuctionHouseBase.sol#L72


 - [ ] ID-133
Function [TransferExecutor.__TransferExecutor_init_unchained(address,address)](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L23-L27) is not in mixedCase

https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L23-L27


## redundant-statements
Impact: Informational
Confidence: High
 - [ ] ID-134
Redundant expression "[this](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L28)" in[ContextUpgradeable](https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L16-L32)

https://github.com/rarible/protocol-contracts/blob/master/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L28


## similar-names
Impact: Informational
Confidence: Medium
 - [ ] ID-135
Variable [TransferExecutor.transfer(LibAsset.Asset,address,address,address).token_scope_0](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L51) is too similar to [TransferExecutor.transfer(LibAsset.Asset,address,address,address).token_scope_1](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L59)

https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/TransferExecutor.sol#L51


 - [ ] ID-136
Variable [ITransferManager.doTransfers(LibDeal.DealSide,LibDeal.DealSide,LibDeal.DealData).totalMakeValue](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/interfaces/ITransferManager.sol#L15) is too similar to [ITransferManager.doTransfers(LibDeal.DealSide,LibDeal.DealSide,LibDeal.DealData).totalTakeValue](https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/interfaces/ITransferManager.sol#L15)

https://github.com/rarible/protocol-contracts/blob/master/@rarible/transfer-manager/contracts/interfaces/ITransferManager.sol#L15


## unused-state
Impact: Informational
Confidence: High
 - [ ] ID-137
[LibERC1155LazyMint._INTERFACE_ID_MINT_AND_TRANSFER](https://github.com/rarible/protocol-contracts/blob/master/@rarible/lazy-mint/contracts/erc-1155/LibERC1155LazyMint.sol#L9) is never used in [LibERC1155LazyMint](https://github.com/rarible/protocol-contracts/blob/master/@rarible/lazy-mint/contracts/erc-1155/LibERC1155LazyMint.sol#L7-L40)

https://github.com/rarible/protocol-contracts/blob/master/@rarible/lazy-mint/contracts/erc-1155/LibERC1155LazyMint.sol#L9


 - [ ] ID-138
[LibERC721LazyMint._INTERFACE_ID_MINT_AND_TRANSFER](https://github.com/rarible/protocol-contracts/blob/master/@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol#L9) is never used in [LibERC721LazyMint](https://github.com/rarible/protocol-contracts/blob/master/@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol#L7-L39)

https://github.com/rarible/protocol-contracts/blob/master/@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol#L9


