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

	struct RoyaltiesSet {
		bool initialized;
		LibPart.Part[] royalties;
	}

	mapping(bytes32 => RoyaltiesSet) public royaltiesByTokenAndTokenId;
	mapping(address => RoyaltiesSet) public royaltiesByToken;
	mapping(address => address) public royaltiesProviders;

	function initializeRoyaltiesRegistry() external {
		__Ownable_init_unchained();
	}

	function setProviderByToken(address token, address provider) external {
		if (!ownerDetected(token)) {
			return;
		}
		royaltiesProviders[token] = provider;
	}

	function setRoyaltiesByToken(address token, LibPart.Part[] memory royalties) external {
		if (!ownerDetected(token)) {
			return;
		}
		saveRoyaltiesInCashByToken(token, royalties);
	}

	function setRoyaltiesByTokenAndTokenId(address token, uint tokenId, LibPart.Part[] memory royalties) external {
		if (!ownerDetected(token)) {
			return;
		}
		saveRoyaltiesInCashByTokenTokeId(token, tokenId, royalties);
	}

	function ownerDetected(address token) internal view returns (bool result) {
		if (owner() == _msgSender()) {
			result = true;
		} else {
			try OwnableUpgradeable(token).owner() returns (address tokenOwner) {
				address ownerSender = _msgSender();
				if ((tokenOwner != address(0x0)) && (ownerSender != address(0x0)) && (tokenOwner == ownerSender)) {
					result = true;
				} else {
					revert("Token owner not detected by OwnableUpgradeable");
				}
			} catch {}
//			TODO: add Ownable
//			try Ownable(token).owner() returns (address tokenOwner) {
//				address ownerSender = _msgSender();
//				if ((tokenOwner != address(0x0)) && (ownerSender != address(0x0)) && (tokenOwner == ownerSender)) {
//					result = true;
//				} else {
//					revert("Token owner not detected by Ownable");
//				}
//			} catch {}
		}
	}

	function getRoyalties(address token, uint tokenId) override external returns (LibPart.Part[] memory ) {
		RoyaltiesSet memory royaltiesSet = royaltiesByTokenAndTokenId[keccak256(abi.encode(token, tokenId))];
		if (royaltiesSet.initialized) {
			return royaltiesSet.royalties;
		}
		royaltiesSet = royaltiesByToken[token];
		if (royaltiesSet.initialized) {
			return royaltiesSet.royalties;
		}
		LibPart.Part[] memory royaltiesContract = royaltiesFromContract(token, tokenId);
		saveRoyaltiesInCashByTokenTokeId (token, tokenId, royaltiesContract);
		LibPart.Part[] memory royaltiesProvidersExtracted = providerExtractors(token);
		saveRoyaltiesInCashByToken (token, royaltiesProvidersExtracted);
		uint royaltiesContractCapacity = royaltiesContract.length;
		LibPart.Part[] memory resultRoyalties = new LibPart.Part[](royaltiesContractCapacity + royaltiesProvidersExtracted.length);
		for (uint i = 0; i < royaltiesContractCapacity; i++) {
			resultRoyalties[i] = royaltiesContract[i];
		}
		for (uint i = 0; i < royaltiesProvidersExtracted.length; i++) {
			resultRoyalties[i + royaltiesContractCapacity] = royaltiesProvidersExtracted[i];
		}
		return resultRoyalties;
	}

	function saveRoyaltiesInCashByTokenTokeId (address token, uint tokenId, LibPart.Part[] memory royalties) internal {
		uint sumRoyalties = 0;
		bytes32 key = keccak256(abi.encode(token, tokenId));
		for (uint i = 0; i < royalties.length; i++) {
			require(royalties[i].account != address(0x0), "Recipient for RoyaltiesByTokenAndTokenId  should be present");
			require(royalties[i].value != 0, "Fee value for RoyaltiesByTokenAndTokenId should be positive");
			royaltiesByTokenAndTokenId[key].royalties.push(royalties[i]);
			sumRoyalties += royalties[i].value;
		}
		require(sumRoyalties < 10000, "Sum royalties by token and tokenId more, than 100%");
		royaltiesByTokenAndTokenId[key].initialized = true;
	}

	function saveRoyaltiesInCashByToken (address token, LibPart.Part[] memory royalties) internal {
		uint sumRoyalties = 0;
		for (uint i = 0; i < royalties.length; i++) {
			require(royalties[i].account != address(0x0), "Recipient for RoyaltiesByTokenAndTokenId  should be present");
			require(royalties[i].value != 0, "Fee value for RoyaltiesByTokenAndTokenId should be positive");
			royaltiesByToken[token].royalties.push(royalties[i]);
			sumRoyalties += royalties[i].value;
		}
		require(sumRoyalties < 10000, "Sum royalties by token and tokenId more, than 100%");
		royaltiesByToken[token].initialized = true;
	}

	function royaltiesFromContract(address token, uint tokenId) internal view returns (LibPart.Part[] memory feesRecipients) {
		if (IERC165Upgradeable(token).supportsInterface(LibRoyaltiesV2._INTERFACE_ID_FEES)) {
			RoyaltiesV2Impl withFees = RoyaltiesV2Impl(token);
			try withFees.getRoyalties(tokenId) returns (LibPart.Part[] memory feesRecipientsResult) {
				return feesRecipientsResult;
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

	function providerExtractors(address token) internal returns (LibPart.Part[] memory royalties) {
		address metodAddress = royaltiesProviders[token];
		if (metodAddress != address(0x0)) {
			IRoyaltiesProvider withRoyalties = IRoyaltiesProvider(metodAddress);
			try withRoyalties.getRoyalties(token, 0x0) returns (LibPart.Part[] memory royaltiesByProvider) {
				royalties = royaltiesByProvider;
			} catch { }
		}
	}

	uint256[46] private __gap;
}
