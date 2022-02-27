// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/transfer-manager/contracts/TransferManagerCore.sol";
import "@rarible/lib-asset/contracts/LibAsset.sol";
import "@rarible/exchange-interfaces/contracts/INftTransferProxy.sol";
import "@rarible/exchange-interfaces/contracts/IERC20TransferProxy.sol";
import "@rarible/libraries/contracts/BpLibrary.sol";
import "@rarible/royalties/contracts/IRoyaltiesProvider.sol";

import "./AuctionHouseBase.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract AuctionTransferExecutor is AuctionHouseBase, TransferManagerCore {
    using LibTransfer for address;
    using BpLibrary for uint;
    using SafeMathUpgradeable for uint;

    function __AuctionTransferExecutor_init_unchained() internal {
    }

    function doTransfers(
        SellAsset memory sellAsset,
        address buyAsset,
        Bid memory bid, 
        address from,
        address buyer,
        address seller,
        uint128 curProtocolFee,
        uint aucOriginFee,
        address proxy,
        uint bidOriginFee,
        uint amount
    ) internal {
        //protocolFee
        amount = transferProtocolFee(
            amount,
            bid.amount,
            curProtocolFee,
            from,
            buyAsset,
            proxy
        );

        //royalties
        amount = transferRoyalties(
            sellAsset,
            amount,
            bid.amount,
            from,
            proxy,
            buyAsset
        );

        //originFeeBid
        amount = transferOriginFee(
            amount,
            bid.amount,
            buyAsset,
            from,
            proxy,
            bidOriginFee
        );

        //originFeeAuc
        amount = transferOriginFee(
            amount,
            bid.amount,
            buyAsset,
            from,
            proxy,
            aucOriginFee
        );

        //transfer bid payouts (what's left of it afer fees) to seller
        transferBid(
            amount,
            buyAsset,
            from,
            seller,
            proxy
        );

        //transfer nft to buyer
        transferNFT(
            sellAsset,
            address(this),
            buyer
        );
    }

    /**
     * @dev execute a transfer
     */
    function transferBid(
        uint value,
        address token,
        address from,
        address to,
        address proxy
    ) internal {
        //bid in eth
        if (token == address(0)) {
            //no need to transfer
            transfer(
                value, 
                0, 
                LibAsset.ETH_ASSET_CLASS, 
                token,
                from,
                to,
                proxy
            ); 
        } else {
            //bid in ERC20
            transfer(
                value, 
                0, 
                LibAsset.ERC20_ASSET_CLASS, 
                token,
                from,
                to,
                proxy
            );
        }
    }

    function transferNFT(
        SellAsset memory sellAsset,
        address from,
        address to
    ) internal {
        transfer(
            1, 
            sellAsset.tokenId, 
            LibAsset.ERC721_ASSET_CLASS, 
            sellAsset.token,
            from,
            to,
            proxies[LibAsset.ERC721_ASSET_CLASS]
        );
    }

    function calculateTotalAmount(
        uint amount,
        uint protocolFee,
        uint originFee
    ) internal pure returns(uint total) {
        (, uint96 originFeeValue) = parseFeeData(originFee);
        total = amount.add(amount.bp(protocolFee));
        total = total.add(amount.bp(originFeeValue));
    }

    function transferOriginFee(
        uint rest,
        uint amount,
        address token,
        address from,
        address proxy,
        uint originFee
    ) internal returns(uint amountLeft) {
        (address originFeeAccount, uint96 originFeeValue) = parseFeeData(originFee);
        (uint newRestValue, uint feeValue) = subFeeInBp(rest, amount, originFeeValue);
        if (feeValue > 0) {
            transferBid(
                feeValue,
                token,
                from,
                originFeeAccount,
                proxy
            );
        }
        return newRestValue;
    }

    function transferProtocolFee(
        uint totalAmount,
        uint amount,
        uint protocolFee,
        address from,
        address token,
        address proxy
    ) internal returns(uint) {
        if (protocolFee == 0) {
            return totalAmount;
        }
        address feeReceiver = getFeeReceiver(token);
        (uint rest, uint fee) = subFeeInBp(totalAmount, amount, protocolFee * 2);
        transferBid(
            fee,
            token,
            from,
            feeReceiver,
            proxy
        );
        return rest;
    }

    function transferRoyalties(
        SellAsset memory sellAsset,
        uint rest,
        uint amount,
        address from,
        address proxy,
        address token
    ) internal returns(uint amountLeft) {
        //todo: get rid of libPart later?
        LibPart.Part[] memory royalties = royaltiesRegistry.getRoyalties(sellAsset.token, sellAsset.tokenId);
        if(royalties.length == 0) {
            return rest;
        }
        uint totalRoyalties = 0;
        uint newRestValue;
        for (uint i = 0; i < royalties.length; i++) {
            uint procRoyalty = royalties[i].value;
            uint feeValue;
            (newRestValue, feeValue) = subFeeInBp(rest, amount, procRoyalty);
            totalRoyalties = totalRoyalties + procRoyalty;
            transferBid(
                feeValue,
                token,
                from,
                royalties[i].account,
                proxy
            );
        }
        require(totalRoyalties <= 5000, "Royalties are too high (>50%)");
        return newRestValue;
    }

    function transfer(
        uint value,
        uint tokenId,
        bytes4 assetClass,
        address token,
        address from,
        address to,
        address proxy
    ) internal {
        if (assetClass == LibAsset.ERC721_ASSET_CLASS) {
            //not using transfer proxy when transfering from this contract
            if (from == address(this)){
                IERC721(token).safeTransferFrom(address(this), to, tokenId);
            } else {
                INftTransferProxy(proxy).erc721safeTransferFrom(IERC721Upgradeable(token), from, to, tokenId);
            }
        } else if (assetClass == LibAsset.ERC20_ASSET_CLASS) {
            //not using transfer proxy when transfering from this contract
            if (from == address(this)){
                IERC20(token).transfer(to, value);
            } else {
                IERC20TransferProxy(proxy).erc20safeTransferFrom(IERC20Upgradeable(token), from, to, value);
            }
        } else if (assetClass == LibAsset.ETH_ASSET_CLASS) {
            if (to != address(this)) {
                to.transferEth(value);
            }
        } else if (assetClass == LibAsset.ERC1155_ASSET_CLASS) {
            //todo: case for erc1155
        }
    }
}
