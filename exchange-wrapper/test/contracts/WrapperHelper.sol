// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import {IERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";

import {IWyvernExchange} from "../../contracts/interfaces/IWyvernExchange.sol";
import {IExchangeV2} from "../../contracts/interfaces/IExchangeV2.sol";
import {LibOrder} from "../../contracts/RaribleExchangeWrapper.sol";
import {LibDirectTransfer} from "../../contracts/RaribleExchangeWrapper.sol";

import {LibSeaPort} from "../../contracts/libraries/LibSeaPort.sol";
import {ISeaPort} from "../../contracts/interfaces/ISeaPort.sol";
import {Ix2y2} from "../../contracts/interfaces/Ix2y2.sol";
import {LibLooksRare} from "../../contracts/libraries/LibLooksRare.sol";
import {ILooksRare} from "../../contracts/interfaces/ILooksRare.sol";
import {ILSSVMRouter} from "../../contracts/interfaces/ILSSVMRouter.sol";

interface IERC1155 {
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;
}

interface IERC721 {
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
}

interface IMatchERC721{
    function matchERC721UsingCriteria(
        address from,
        address to,
        IERC721 token,
        uint256 tokenId,
        bytes32 root,
        bytes32[] calldata proof
    ) external returns (bool);
}

interface IMatchERC1155{
    /*This method  Merkle validator https://etherscan.io/address/0xbaf2127b49fc93cbca6269fade0f7f31df4c88a7#code
    */
    function matchERC1155UsingCriteria(
        address from,
        address to,
        IERC1155 token,
        uint256 tokenId,
        uint256 amount,
        bytes32 root,
        bytes32[] calldata proof
    ) external returns (bool);
}

/*Interface with error*/
interface IWyvernExchangeError {
    /*method is not exist in WyvernBulkExchange contract*/
    function atomicMatchError_(
        address[14] memory addrs,
        uint[18] memory uints,
        uint8[8] memory feeMethodsSidesKindsHowToCalls,
        bytes memory calldataBuy,
        bytes memory calldataSell,
        bytes memory replacementPatternBuy,
        bytes memory replacementPatternSell,
        bytes memory staticExtradataBuy,
        bytes memory staticExtradataSell,
        uint8[2] memory vs,
        bytes32[5] memory rssMetadata)
    external
    payable;
}

contract WrapperHelper {

    struct WyvernOrders {
        address[14] addrs;
        uint[18]  uints;
        uint8[8]  feeMethodsSidesKindsHowToCalls;
        bytes  calldataBuy;
        bytes  calldataSell;
        bytes  replacementPatternBuy;
        bytes  replacementPatternSell;
        bytes  staticExtradataBuy;
        bytes  staticExtradataSell;
        uint8[2]  vs;
        bytes32[5]  rssMetadata;
    }

    struct RaribleBuy {
        LibOrder.Order orderLeft;
        bytes signatureLeft;
        LibOrder.Order orderRight;
        bytes signatureRight;
    }

    struct AdditionalData {
        bytes data;
        uint[] additionalRoyalties;
    }

    function getDataWyvernAtomicMatch(WyvernOrders memory _openSeaBuy) external pure returns(bytes memory _data) {
        _data = abi.encodeWithSelector(IWyvernExchange.atomicMatch_.selector, _openSeaBuy.addrs, _openSeaBuy.uints, _openSeaBuy.feeMethodsSidesKindsHowToCalls, _openSeaBuy.calldataBuy, _openSeaBuy.calldataSell, _openSeaBuy.replacementPatternBuy, _openSeaBuy.replacementPatternSell, _openSeaBuy.staticExtradataBuy, _openSeaBuy.staticExtradataSell, _openSeaBuy.vs, _openSeaBuy.rssMetadata);
    }

    function getDataWyvernAtomicMatchWithError(WyvernOrders memory _openSeaBuy) external pure returns(bytes memory _data) {
        _data = abi.encodeWithSelector(IWyvernExchangeError.atomicMatchError_.selector, _openSeaBuy.addrs, _openSeaBuy.uints, _openSeaBuy.feeMethodsSidesKindsHowToCalls, _openSeaBuy.calldataBuy, _openSeaBuy.calldataSell, _openSeaBuy.replacementPatternBuy, _openSeaBuy.replacementPatternSell, _openSeaBuy.staticExtradataBuy, _openSeaBuy.staticExtradataSell, _openSeaBuy.vs, _openSeaBuy.rssMetadata);
    }

    function getDataERC721UsingCriteria(
        address from,
        address to,
        IERC721Upgradeable token,
        uint256 tokenId
    ) external pure returns(bytes memory _data) {
        _data = abi.encodeWithSelector(IMatchERC721.matchERC721UsingCriteria.selector, from, to, token, tokenId);
    }

    function getDataERC1155UsingCriteria(
        address from,
        address to,
        IERC1155Upgradeable token,
        uint256 tokenId,
        uint256 amount
    ) external pure returns(bytes memory _data) {
        _data = abi.encodeWithSelector(IMatchERC1155.matchERC1155UsingCriteria.selector, from, to, token, tokenId, amount);
    }

    function encodeOriginFeeIntoUint(address account, uint96 value) external pure returns(uint){
        return (uint(value) << 160) + uint(account);
    }

    function getDataDirectPurchase(LibDirectTransfer.Purchase memory data) external pure returns(bytes memory result) {
        result = abi.encodeWithSelector(IExchangeV2.directPurchase.selector, data);
    }

    function getDataSeaPortFulfillAdvancedOrder(
        LibSeaPort.AdvancedOrder memory _advancedOrder,
        LibSeaPort.CriteriaResolver[] memory _criteriaResolvers,
        bytes32 _fulfillerConduitKey,
        address _recipient
    ) external pure returns(bytes memory _data) {
        _data = abi.encodeWithSelector(ISeaPort.fulfillAdvancedOrder.selector, _advancedOrder, _criteriaResolvers, _fulfillerConduitKey, _recipient);
    }

    function getDataSeaPortFulfillAvailableAdvancedOrders(
        LibSeaPort.AdvancedOrder[] memory _orders,
        LibSeaPort.CriteriaResolver[] memory _criteriaResolvers,
        LibSeaPort.FulfillmentComponent[][] memory _offerFulfillments,
        LibSeaPort.FulfillmentComponent[][] memory _considerationFulfillments,
        bytes32 _fulfillerConduitKey,
        address _recipient,
        uint256 _maximumFulfilled
    ) external pure returns(bytes memory _data) {
        _data = abi.encodeWithSelector(
            ISeaPort.fulfillAvailableAdvancedOrders.selector,
            _orders,
            _criteriaResolvers,
            _offerFulfillments,
            _considerationFulfillments,
            _fulfillerConduitKey,
            _recipient,
            _maximumFulfilled
        );
    }

    function getDataSeaPortBasic(LibSeaPort.BasicOrderParameters calldata seaPortBasic, bytes4 typeNft) external pure returns(bytes memory _data) {
        _data = abi.encode(seaPortBasic, typeNft);
    }

    function encodeData(Ix2y2.Pair721[] calldata data) external pure returns(bytes memory){
        return abi.encode(data);
    }

    function encodeData1155(Ix2y2.Pair1155[] calldata data) external pure returns(bytes memory){
        return abi.encode(data);
    }

    function hashItem(Ix2y2.Order memory order, Ix2y2.OrderItem memory item)
        external
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    order.salt,
                    order.user,
                    order.network,
                    order.intent,
                    order.delegateType,
                    order.deadline,
                    order.currency,
                    order.dataMask,
                    item
                )
            );
    }

    function encodeX2Y2Call(Ix2y2.RunInput calldata data) external pure returns(bytes memory) {
        return abi.encode(data);
    }

    
    function getDataWrapperMatchAskWithTakerBidUsingETHAndWETH(LibLooksRare.TakerOrder calldata _takerBid, LibLooksRare.MakerOrder calldata _makerAsk, bytes4 typeNft) external pure returns(bytes memory _data) {
        _data = abi.encode(_takerBid, _makerAsk, typeNft);
    }

    function encodeFees(uint first, uint second) external pure returns(uint){
        return (uint(uint16(first)) << 16) + uint(uint16(second));
    }

    function encodeFeesPlusDataType(uint dataType, uint first, uint second) external pure returns(uint){
        return (uint(uint16(dataType)) << 32) + (uint(uint16(first)) << 16) + uint(uint16(second));
    }

    function encodeCurrencyAndDataTypeAndFees(uint currency, uint dataType, uint first, uint second) external pure returns(uint){
        return (uint(uint16(currency)) << 48) + (uint(uint16(dataType)) << 32) + (uint(uint16(first)) << 16) + uint(uint16(second));
    }

    function encodeDataPlusRoyalties(AdditionalData calldata data) external pure returns(bytes memory) {
        return abi.encode(data);
    }

    function encodeBpPlusAccount(uint bp, address account) external pure returns (uint) {
        return (uint(bp) << 160) + uint(account);
    }

    function decodeFees(uint data) external pure returns(uint, uint) {
        uint first = uint(uint16(data >> 16));
        uint second = uint(uint16(data));
        return (first, second);
    }

    function encodeSudoSwapCall(
        ILSSVMRouter.PairSwapSpecific[] calldata swapList,
        address payable ethRecipient,
        address nftRecipient,
        uint256 deadline
    ) external pure returns (bytes memory _data) {
        _data = abi.encodeWithSelector(ILSSVMRouter.swapETHForSpecificNFTs.selector, swapList, ethRecipient, nftRecipient, deadline);
    }

}