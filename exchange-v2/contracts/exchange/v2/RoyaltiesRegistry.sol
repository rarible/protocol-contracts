// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "./LibAsset.sol";
import "@rarible/royalties/contracts/RoyaltiesV1.sol";
import "@rarible/royalties/contracts/LibRoyaltiesV2.sol";
import "@rarible/royalties/contracts/LibRoyaltiesV1.sol";
import "@rarible/royalties/contracts/impl/RoyaltiesV1Impl.sol";
import "@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "../../utils/BpLibrary.sol";
import "@rarible/royalties/contracts/LibPart.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract RoyaltiesRegistry is OwnableUpgradeable {
    using BpLibrary for uint;
    using SafeMathUpgradeable for uint;

    mapping(address => LibPart.Part[] ) public royaltiesByToken;

    function setTokenRoyalties(address token, LibPart.Part[] memory royalties) external onlyOwner {
        royaltiesByToken[token] = royalties;
    }

    //todo uint tokenId - not used
    function getRoyalties(address token, uint tokenId, LibAsset.AssetType memory asset
    ) internal view returns (LibPart.Part[] memory royalties){
        royalties = royaltiesByToken[token];
        if (royalties.length == 0){
            royalties = getRoyaltiesFromAsset(asset);
        }
    }

    function getRoyaltiesFromAsset(LibAsset.AssetType memory asset) internal view returns (LibPart.Part[] memory feesRecipients) {
        if (asset.tp != LibAsset.ERC1155_ASSET_TYPE && asset.tp != LibAsset.ERC721_ASSET_TYPE) {
            return feesRecipients;
        }
        (address addressAsset, uint tokenIdAsset) = abi.decode(asset.data, (address, uint));
        if (IERC165Upgradeable(addressAsset).supportsInterface(LibRoyaltiesV2._INTERFACE_ID_FEES)) {
            RoyaltiesV2Impl withFees = RoyaltiesV2Impl(addressAsset);
            try withFees.getRoyalties(tokenIdAsset) returns (LibPart.Part[] memory feesRecipientsResult) {
                feesRecipients = feesRecipientsResult;
            } catch {}
        } else if (IERC165Upgradeable(addressAsset).supportsInterface(LibRoyaltiesV1._INTERFACE_ID_FEES)) {
            RoyaltiesV1Impl withFees = RoyaltiesV1Impl(addressAsset);
            address payable[] memory recipients;
            try withFees.getFeeRecipients(tokenIdAsset) returns (address payable[] memory recipientsResult) {
                recipients = recipientsResult;
            } catch {
                return feesRecipients;
            }
            uint[] memory fees;
            try withFees.getFeeBps(tokenIdAsset) returns (uint[] memory feesResult) {
                fees = feesResult;
            } catch {
                return feesRecipients;
            }
            if (fees.length != recipients.length) {
                return feesRecipients;
            }
            feesRecipients = new LibPart.Part[](fees.length);
            for (uint256 i = 0; i < fees.length; i++) {
                feesRecipients[i].value = fees[i];
                feesRecipients[i].account = recipients[i];
            }
        }
        return feesRecipients;
    }


    uint256[46] private __gap;
}
