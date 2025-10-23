// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@rarible/exchange-interfaces/contracts/IRoyaltiesProvider.sol";
import "@rarible/royalties/contracts/LibRoyaltiesV2.sol";
import "@rarible/royalties/contracts/LibRoyaltiesV1.sol";
import "@rarible/royalties/contracts/LibRoyalties2981.sol";
import "@rarible/royalties/contracts/RoyaltiesV1.sol";
import "@rarible/royalties/contracts/RoyaltiesV2.sol";
import "@rarible/royalties/contracts/IERC2981.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

//old RoyaltiesRegistry with royaltiesProviders changed to  mapping(address => uint) to test upgradeability
contract RoyaltiesRegistryOld is IRoyaltiesProvider, OwnableUpgradeable {

    event RoyaltiesSetForToken(address indexed token, uint indexed tokenId, LibPart.Part[] royalties);
    event RoyaltiesSetForContract(address indexed token, LibPart.Part[] royalties);

    struct RoyaltiesSet {
        bool initialized;
        LibPart.Part[] royalties;
    }

    mapping(bytes32 => RoyaltiesSet) public royaltiesByTokenAndTokenId;
    mapping(address => RoyaltiesSet) public royaltiesByToken;
    mapping(address => uint) public royaltiesProviders;

    function __RoyaltiesRegistry_init() external initializer {
        __Ownable_init_unchained();
    }

    function setProviderByToken(address token, address provider) external {
        checkOwner(token);
        royaltiesProviders[token] = uint(provider);
    }

    function getProvider(address token) public view returns(address) {
        return address(royaltiesProviders[token]);
    }

    function setRoyaltiesByToken(address token, LibPart.Part[] memory royalties) external {
        checkOwner(token);
        uint sumRoyalties = 0;
        delete royaltiesByToken[token];
        for (uint i = 0; i < royalties.length; ++i) {
            require(royalties[i].account != address(0x0), "RoyaltiesByToken recipient should be present");
            require(royalties[i].value != 0, "Royalty value for RoyaltiesByToken should be > 0");
            royaltiesByToken[token].royalties.push(royalties[i]);
            sumRoyalties += royalties[i].value;
        }
        require(sumRoyalties < 10000, "Set by token royalties sum more, than 100%");
        royaltiesByToken[token].initialized = true;
        emit RoyaltiesSetForContract(token, royalties);
    }

    function setRoyaltiesByTokenAndTokenId(address token, uint tokenId, LibPart.Part[] memory royalties) external {
        checkOwner(token);
        setRoyaltiesCacheByTokenAndTokenId(token, tokenId, royalties);
    }

    function checkOwner(address token) internal view {
        if ((owner() != _msgSender()) && (OwnableUpgradeable(token).owner() != _msgSender())) {
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
        (bool result, LibPart.Part[] memory resultRoyalties) = providerExtractor(token, tokenId);
        if (result == false) {
            resultRoyalties = royaltiesFromContract(token, tokenId);
        }
        setRoyaltiesCacheByTokenAndTokenId(token, tokenId, resultRoyalties);
        return resultRoyalties;
    }

    function setRoyaltiesCacheByTokenAndTokenId(address token, uint tokenId, LibPart.Part[] memory royalties) internal {
        uint sumRoyalties = 0;
        bytes32 key = keccak256(abi.encode(token, tokenId));
        delete royaltiesByTokenAndTokenId[key].royalties;
        for (uint i = 0; i < royalties.length; ++i) {
            require(royalties[i].account != address(0x0), "RoyaltiesByTokenAndTokenId recipient should be present");
            require(royalties[i].value != 0, "Royalty value for RoyaltiesByTokenAndTokenId should be > 0");
            royaltiesByTokenAndTokenId[key].royalties.push(royalties[i]);
            sumRoyalties += royalties[i].value;
        }
        require(sumRoyalties < 10000, "Set by token and tokenId royalties sum more, than 100%");
        royaltiesByTokenAndTokenId[key].initialized = true;
        emit RoyaltiesSetForToken(token, tokenId, royalties);
    }

    function royaltiesFromContract(address token, uint tokenId) internal view returns (LibPart.Part[] memory) {
        (LibPart.Part[] memory royalties, bool isNative) = royaltiesFromContractNative(token, tokenId);
        if (isNative) {
            return royalties;
        }
        return royaltiesFromContractSpecial(token, tokenId);
    }

    function royaltiesFromContractNative(address token, uint tokenId) internal view returns (LibPart.Part[] memory, bool) {
        if (IERC165Upgradeable(token).supportsInterface(LibRoyaltiesV2._INTERFACE_ID_ROYALTIES)) {
            RoyaltiesV2 v2 = RoyaltiesV2(token);
            try v2.getRaribleV2Royalties(tokenId) returns (LibPart.Part[] memory result) {
                return (result, true);
            } catch {
                return (new LibPart.Part[](0), false);
            }
        }
        RoyaltiesV1 v1 = RoyaltiesV1(token);
        address payable[] memory recipients;
        try v1.getFeeRecipients(tokenId) returns (address payable[] memory result) {
            recipients = result;
        } catch {
            return (new LibPart.Part[](0), false);
        }
        uint[] memory values;
        try v1.getFeeBps(tokenId) returns (uint[] memory result) {
            values = result;
        } catch {
            return (new LibPart.Part[](0), false);
        }
        if (values.length != recipients.length) {
            return (new LibPart.Part[](0), true);
        }
        LibPart.Part[] memory result = new LibPart.Part[](values.length);
        for (uint256 i = 0; i < values.length; ++i) {
            result[i].value = uint96(values[i]);
            result[i].account = recipients[i];
        }
        return (result, true);
    }

    function royaltiesFromContractSpecial(address token, uint tokenId) internal view returns (LibPart.Part[] memory) {
        if (IERC165Upgradeable(token).supportsInterface(LibRoyalties2981._INTERFACE_ID_ROYALTIES)) {
            IERC2981 v2981 = IERC2981(token);
            try v2981.royaltyInfo(tokenId, LibRoyalties2981._WEIGHT_VALUE) returns (address receiver, uint256 royaltyAmount) {
                return LibRoyalties2981.calculateRoyalties(receiver, royaltyAmount);
            } catch {
                return new LibPart.Part[](0);
            }
        }
        return new LibPart.Part[](0);
    }

    function providerExtractor(address token, uint tokenId) internal returns (bool result, LibPart.Part[] memory royalties) {
        result = false;
        address providerAddress = getProvider(token);
        if (providerAddress != address(0x0)) {
            IRoyaltiesProvider provider = IRoyaltiesProvider(providerAddress);
            try provider.getRoyalties(token, tokenId) returns (LibPart.Part[] memory royaltiesByProvider) {
                royalties = royaltiesByProvider;
                result = true;
            } catch {}
        }
    }

    uint256[46] private __gap;
}