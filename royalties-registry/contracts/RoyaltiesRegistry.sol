// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@rarible/royalties/contracts/IRoyaltiesProvider.sol";
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

	function __RoyaltiesRegistry_init() external initializer {
		__Ownable_init_unchained();
	}

	function setProviderByToken(address token, address provider) external {
		checkOwner(token);
		royaltiesProviders[token] = provider;
	}

	function setRoyaltiesByToken(address token, LibPart.Part[] memory royalties) external {
		checkOwner(token);
		uint sumRoyalties = 0;
		for (uint i = 0; i < royalties.length; i++) {
			require(royalties[i].account != address(0x0), "RoyaltiesByToken recipient should be present");
			require(royalties[i].value != 0, "Fee value for RoyaltiesByToken should be > 0");
			royaltiesByToken[token].royalties.push(royalties[i]);
			sumRoyalties += royalties[i].value;
		}
		require(sumRoyalties < 10000, "Set by token royalties sum more, than 100%");
		royaltiesByToken[token].initialized = true;
	}

	function setRoyaltiesByTokenAndTokenId(address token, uint tokenId, LibPart.Part[] memory royalties) external {
		checkOwner(token);
		setRoyaltiesCacheByTokenAndTokenId(token, tokenId, royalties);
	}

	function checkOwner(address token) internal view {
		if ((owner() != _msgSender()) && (OwnableUpgradeable(token).owner() != _msgSender())){
			revert("Token owner not detected");
		}
	}

	function getRoyalties(address token, uint tokenId) override external returns (LibPart.Part[] memory) {
		RoyaltiesSet memory royaltiesSet = royaltiesByTokenAndTokenId[keccak256(abi.encode(token, tokenId))];
		if (royaltiesSet.initialized) {
			return royaltiesSet.royalties;
		}
		royaltiesSet = royaltiesByToken[token];
		if (royaltiesSet.initialized) {
			return royaltiesSet.royalties;
		}
		(bool result, LibPart.Part[] memory resultRoyalties) = providerExtractor(token);
		if (result == false) {
			resultRoyalties = royaltiesFromContract(token, tokenId);
		}
		setRoyaltiesCacheByTokenAndTokenId (token, tokenId, resultRoyalties);
		return resultRoyalties;
	}

	function setRoyaltiesCacheByTokenAndTokenId(address token, uint tokenId, LibPart.Part[] memory royalties) internal {
		uint sumRoyalties = 0;
		bytes32 key = keccak256(abi.encode(token, tokenId));
		for (uint i = 0; i < royalties.length; i++) {
			require(royalties[i].account != address(0x0), "RoyaltiesByTokenAndTokenId recipient should be present");
			require(royalties[i].value != 0, "Fee value for RoyaltiesByTokenAndTokenId should be > 0");
			royaltiesByTokenAndTokenId[key].royalties.push(royalties[i]);
			sumRoyalties += royalties[i].value;
		}
		require(sumRoyalties < 10000, "Set by token and tokenId royalties sum more, than 100%");
		royaltiesByTokenAndTokenId[key].initialized = true;
	}

	function royaltiesFromContract(address token, uint tokenId) internal view returns (LibPart.Part[] memory feesRecipients) {
		if (IERC165Upgradeable(token).supportsInterface(LibRoyaltiesV2._INTERFACE_ID_ROYALTIES)) {
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
				feesRecipients[i].value = uint96(fees[i]);
				feesRecipients[i].account = recipients[i];
			}
		}
		return feesRecipients;
	}

	function providerExtractor(address token) internal returns (bool result, LibPart.Part[] memory royalties) {
		address provider = royaltiesProviders[token];
		if (provider != address(0x0)) {
			IRoyaltiesProvider withRoyalties = IRoyaltiesProvider(provider);
			try withRoyalties.getRoyalties(token, 0x0) returns (LibPart.Part[] memory royaltiesByProvider) {
				royalties = royaltiesByProvider;
				result = true;
			} catch { }
		}
	}

	uint256[46] private __gap;
}
