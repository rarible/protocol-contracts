// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./IRoyaltiesProvider.sol";
import "@rarible/royalties/contracts/LibRoyaltiesV2.sol";
import "@rarible/royalties/contracts/LibRoyaltiesV1.sol";
import "@rarible/royalties/contracts/impl/RoyaltiesV1Impl.sol";
import "@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract RoyaltiesRegistry is IRoyaltiesProvider, OwnableUpgradeable {

	mapping(bytes32 => LibPart.Part[]) public royaltiesByTokenAndTokenId;
	mapping(address => LibPart.Part[]) public royaltiesByToken;
	mapping(address => address) public royaltiesExtractors;

	function initializeRoyaltiesRegistry() external {
		__Ownable_init_unchained();
	}

//	  todo think need rezult setRoyaltiesByToken true or false?
	function setRoyaltiesByToken(address token, LibPart.Part[] memory royalties) override external {
		if (!ownerDetected(token)) {
			return;
		}
		for (uint i = 0; i < royalties.length; i++) {
			require(royalties[i].account != address(0x0), "Recipient for RoyaltiesByToken should be present");
			require(royalties[i].value != 0, "Fee value for RoyaltiesByToken should be positive");
			royaltiesByToken[token].push(royalties[i]);
		}
	}

	function setRoyaltiesByTokenAndTokenId(address token, uint tokenId, LibPart.Part[] memory royalties) override external {
		if (!ownerDetected(token)) {
			return;
		}
		bytes32 key = keccak256(abi.encode(token, tokenId));
		for (uint i = 0; i < royalties.length; i++) {
			require(royalties[i].account != address(0x0), "Recipient for RoyaltiesByTokenAndTokenId  should be present");
			require(royalties[i].value != 0, "Fee value for RoyaltiesByTokenAndTokenId should be positive");
			royaltiesByTokenAndTokenId[key].push(royalties[i]);
		}
	}

	function ownerDetected(address token) internal returns (bool result){
		result = false;
		if (owner() == _msgSender()) {
			result = true;
		} else {
			try OwnableUpgradeable(token).owner() returns (address tokenOwner){
				address ownerSender = msg.sender;
				if ((tokenOwner != address(0x0)) && (ownerSender != address(0x0)) && (tokenOwner == ownerSender)) {
					result = true;
				} else {
					revert("Token owner not detected");
				}
			} catch {}
		}
	}

	function getRoyalties(
		address token,
		uint tokenId
	) override external returns (LibPart.Part[] memory royalties) {
		royalties = royaltiesByTokenAndTokenId[keccak256(abi.encode(token, tokenId))];
		if (royalties.length != 0) {
			return royalties;
		}
		royalties = royaltiesByToken[token];
		if (royalties.length != 0) {
			return royalties;
		}
		royalties = getRoyaltiesFromContract(token, tokenId);
		if (royalties.length != 0) {
			return royalties;
		}
		royalties = royaltiesExternalProvider(token, tokenId);
		if (royalties.length != 0) {
			bytes32 key = keccak256(abi.encode(token, tokenId));
			for (uint i = 0; i < royalties.length; i++) {
				require(royalties[i].account != address(0x0), "Recipient for RoyaltiesByTokenAndTokenId  should be present");
				require(royalties[i].value != 0, "Fee value for RoyaltiesByTokenAndTokenId should be positive");
				royaltiesByTokenAndTokenId[key].push(royalties[i]);
			}
		}
	}

	function getRoyaltiesFromContract(address token, uint tokenId) internal view returns (LibPart.Part[] memory feesRecipients) {
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

	//  todo write me
	function royaltiesExternalProvider(address, uint) internal view returns (LibPart.Part[] memory) {
		//    return feesRecipients;
	}

	uint256[46] private __gap;
}
