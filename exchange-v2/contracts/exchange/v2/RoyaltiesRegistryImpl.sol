// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./AbstractRoyaltiesRegistry.sol";
import "./RoyaltiesRegistryIFace.sol";
import "@rarible/royalties/contracts/LibRoyaltiesV2.sol";
import "@rarible/royalties/contracts/LibRoyaltiesV1.sol";
import "@rarible/royalties/contracts/impl/RoyaltiesV1Impl.sol";
import "@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

contract RoyaltiesRegistryImpl is AbstractRoyaltiesRegistry, RoyaltiesRegistryIFace {

  function getRoyalties(
    address token,
    uint tokenId
  ) override external view returns (LibPart.Part[] memory){
    LibPart.Part[] memory royalties = royaltiesByToken[token];
    if (royalties.length == 0){
      royalties = getRoyaltiesFromAsset(token, tokenId);
    }
    return royalties;
  }

  function getRoyaltiesFromAsset(address token, uint tokenId) internal view returns (LibPart.Part[] memory feesRecipients) {
    if (IERC165Upgradeable(token).supportsInterface(LibRoyaltiesV2._INTERFACE_ID_FEES)) {
      RoyaltiesV2Impl withFees = RoyaltiesV2Impl(token);
      try withFees.getRoyalties(tokenId) returns (LibPart.Part[] memory feesRecipientsResult) {
        feesRecipients = feesRecipientsResult;
      } catch {}
    } else if (IERC165Upgradeable(token).supportsInterface(LibRoyaltiesV1._INTERFACE_ID_FEES)) {
      RoyaltiesV1Impl withFees = RoyaltiesV1Impl(token);
      address payable[] memory recipients;
      try withFees.getFeeRecipients(tokenId) returns (address payable[] memory recipientsResult) {
        recipients = recipientsResult;
      } catch {
        return feesRecipients;
      }
      uint[] memory fees;
      try withFees.getFeeBps(tokenId) returns (uint[] memory feesResult) {
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
