// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/transfer-manager/contracts/lib/LibTransfer.sol";
import "@rarible/lib-asset/contracts/LibAsset.sol";
import "@rarible/exchange-interfaces/contracts/INftTransferProxy.sol";
import "@rarible/exchange-interfaces/contracts/IERC20TransferProxy.sol";
import "@rarible/exchange-interfaces/contracts/ITransferManager.sol";
import "@rarible/libraries/contracts/BpLibrary.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./AuctionHouseBase.sol";

abstract contract AuctionTransferExecutor is AuctionHouseBase {
    using LibTransfer for address;
    using BpLibrary for uint;
    using SafeMathUpgradeable for uint;

    struct TransferData {
        uint value;
        uint tokenId;
        bytes4 assetClass;
        address token;
    }

    //transfer directions:
    bytes4 constant TO_LOCK = bytes4(keccak256("TO_LOCK"));
    bytes4 constant TO_SELLER = bytes4(keccak256("TO_SELLER"));
    bytes4 constant TO_BIDDER = bytes4(keccak256("TO_BIDDER"));

    //transfer types:
    bytes4 constant LOCK = bytes4(keccak256("LOCK"));
    bytes4 constant UNLOCK = bytes4(keccak256("UNLOCK"));
    bytes4 constant PROTOCOL = bytes4(keccak256("PROTOCOL"));
    bytes4 constant ROYALTY = bytes4(keccak256("ROYALTY"));
    bytes4 constant ORIGIN = bytes4(keccak256("ORIGIN"));
    bytes4 constant PAYOUT = bytes4(keccak256("PAYOUT"));


    /// @dev transfer manager for executing the deal
    ITransferManager public transferManager;

    //events
    event Transfer(TransferData data, address from, address to, bytes4 transferDirection, bytes4 transferType);

    function __AuctionTransferExecutor_init_unchained(ITransferManager _transferManager) internal {
        transferManager = _transferManager;
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
                TransferData(value, 0, LibAsset.ETH_ASSET_CLASS, token),
                from,
                to,
                proxy
            ); 
        } else {
            //bid in ERC20
            transfer(
                TransferData(value, 0, LibAsset.ERC20_ASSET_CLASS, token),
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
            TransferData(1, sellAsset.tokenId, LibAsset.ERC721_ASSET_CLASS, sellAsset.token),
            from,
            to,
            transferManager.getProxy(LibAsset.ERC721_ASSET_CLASS)
        );
    }

    function calculateTotalAmount(
        uint amount,
        uint protocolFee,
        LibPart.Part memory originFee
    ) internal pure returns(uint total) {
        total = amount.add(amount.bp(protocolFee));
        total = total.add(amount.bp(originFee.value));
    }

    function transferOriginFee(
        uint rest,
        uint amount,
        address token,
        address from,
        address proxy,
        LibPart.Part memory originFee
    ) internal returns(uint amountLeft) {
        (uint newRestValue, uint feeValue) = subFeeInBp(rest, amount, originFee.value);
        if (feeValue > 0) {
            transferBid(
                feeValue,
                token,
                from,
                originFee.account,
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
        address feeReceiver = transferManager.getFeeReceiver(token);
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
        LibPart.Part[] memory royalties = transferManager.getRoyalties(sellAsset.token, sellAsset.tokenId);
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
        TransferData memory transferData,
        address from,
        address to,
        address proxy
    ) internal {
        if (transferData.assetClass == LibAsset.ERC721_ASSET_CLASS) {
            //not using transfer proxy when transfering from this contract
            if (from == address(this)){
                IERC721(transferData.token).safeTransferFrom(address(this), to, transferData.tokenId);
            } else {
                INftTransferProxy(proxy).erc721safeTransferFrom(IERC721Upgradeable(transferData.token), from, to, transferData.tokenId);
            }
        } else if (transferData.assetClass == LibAsset.ERC20_ASSET_CLASS) {
            //not using transfer proxy when transfering from this contract
            if (from == address(this)){
                IERC20(transferData.token).transfer(to, transferData.value);
            } else {
                IERC20TransferProxy(proxy).erc20safeTransferFrom(IERC20Upgradeable(transferData.token), from, to, transferData.value);
            }
        } else if (transferData.assetClass == LibAsset.ETH_ASSET_CLASS) {
            if (to != address(this)) {
                to.transferEth(transferData.value);
            }
        } else if (transferData.assetClass == LibAsset.ERC1155_ASSET_CLASS) {
            //todo: case for erc1155
        }
    }

    function subFeeInBp(uint value, uint total, uint feeInBp) internal pure returns (uint newValue, uint realFee) {
        return subFee(value, total.bp(feeInBp));
    }

    function subFee(uint value, uint fee) internal pure returns (uint newValue, uint realFee) {
        if (value > fee) {
            newValue = value.sub(fee);
            realFee = fee;
        } else {
            newValue = 0;
            realFee = value;
        }
    }
}
