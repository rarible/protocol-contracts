// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@rarible/royalties/contracts/IRoyaltiesProvider.sol";
import "@rarible/royalties/contracts/LibRoyaltiesV2.sol";
import "@rarible/royalties/contracts/LibRoyaltiesV1.sol";
import "@rarible/royalties/contracts/LibRoyalties2981.sol";
import "@rarible/royalties/contracts/RoyaltiesV1.sol";
import "@rarible/royalties/contracts/RoyaltiesV2.sol";
import "@rarible/royalties/contracts/IERC2981.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract RoyaltiesRegistry is IRoyaltiesProvider, OwnableUpgradeable {
    /// @dev deprecated
    event RoyaltiesSetForToken(address indexed token, uint indexed tokenId, LibPart.Part[] royalties);
    /// @dev emitted when royalties set for token in 
    event RoyaltiesSetForContract(address indexed token, LibPart.Part[] royalties);

    /// @dev struct to store royalties in royaltiesByToken
    struct RoyaltiesSet {
        bool initialized;
        LibPart.Part[] royalties;
    }

    /// @dev deprecated
    mapping(bytes32 => RoyaltiesSet) public royaltiesByTokenAndTokenId;
    /// @dev stores royalties for token contract, set in setRoyaltiesByToken() method
    mapping(address => RoyaltiesSet) public royaltiesByToken;
    /// @dev stores external provider and royalties type for token contract
    mapping(address => uint) public royaltiesProviders;

    /// @dev total amount or supported royalties types
    // 0 - royalties type is unset
    // 1 - royaltiesByToken, 2 - v2, 3 - v1,
    // 4 - external provider, 5 - EIP-2981
    // 6 - unsupported/nonexistent royalties type
    uint constant royaltiesTypesAmount = 6;

    function __RoyaltiesRegistry_init() external initializer {
        __Ownable_init_unchained();
    }

    /// @dev sets external provider for token contract, and royalties type = 4
    function setProviderByToken(address token, address provider) external {
        checkOwner(token);
        setRoyaltiesType(token, 4, provider);
    }

    /// @dev returns provider address for token contract from royaltiesProviders mapping
    function getProvider(address token) public view returns(address) {
        return address(royaltiesProviders[token]);
    }

    /// @dev returns royalties type for token contract
    function getRoyaltiesType(address token) external view returns(uint) {
        return _getRoyaltiesType(royaltiesProviders[token]);
    }

    /// @dev returns royalties type from uint
    function _getRoyaltiesType(uint data) internal pure returns(uint) {
        for (uint i = 1; i <= royaltiesTypesAmount; i++) {
            if (data / 2**(256-i) == 1) {
                return i;
            }
        }
        return 0;
    }

    /// @dev sets royalties type for token contract
    function setRoyaltiesType(address token, uint royaltiesType, address royaltiesProvider) internal {
        require(royaltiesType > 0 && royaltiesType <= royaltiesTypesAmount, "wrong royaltiesType");
        royaltiesProviders[token] = uint(royaltiesProvider) + 2**(256 - royaltiesType);
    }

    /// @dev clears and sets new royalties type for token contract
    function forceSetRoyaltiesType(address token, uint royaltiesType) external {
        checkOwner(token);
        setRoyaltiesType(token, royaltiesType, getProvider(token));
    }

    /// @dev clears royalties type for token contract
    function clearRoyaltiesType(address token) external {
        checkOwner(token);
        royaltiesProviders[token] = uint(getProvider(token));
    }

    /// @dev sets royalties for token contract in royaltiesByToken mapping and royalties type = 1
    function setRoyaltiesByToken(address token, LibPart.Part[] memory royalties) external {
        checkOwner(token);
        //clearing royaltiesProviders value for the token
        delete royaltiesProviders[token];
        // setting royaltiesType = 1 for the token
        setRoyaltiesType(token, 1, address(0));
        uint sumRoyalties = 0;
        delete royaltiesByToken[token];
        for (uint i = 0; i < royalties.length; i++) {
            require(royalties[i].account != address(0x0), "RoyaltiesByToken recipient should be present");
            require(royalties[i].value != 0, "Royalty value for RoyaltiesByToken should be > 0");
            royaltiesByToken[token].royalties.push(royalties[i]);
            sumRoyalties += royalties[i].value;
        }
        require(sumRoyalties < 10000, "Set by token royalties sum more, than 100%");
        royaltiesByToken[token].initialized = true;
        emit RoyaltiesSetForContract(token, royalties);
    }

    /// @dev checks if msg.sender is owner of this contract or owner of the token contract
    function checkOwner(address token) internal view {
        if ((owner() != _msgSender()) && (OwnableUpgradeable(token).owner() != _msgSender())) {
            revert("Token owner not detected");
        }
    }

    /// @dev calculates royalties type for token contract
    function calculateRoyaltiesType(address token, address royaltiesProvider ) internal view returns(uint) {   
        try IERC165Upgradeable(token).supportsInterface(LibRoyaltiesV2._INTERFACE_ID_ROYALTIES) returns(bool result) {
            if (result) {
                return 2;
            }
        } catch { }

        try IERC165Upgradeable(token).supportsInterface(LibRoyaltiesV1._INTERFACE_ID_FEES) returns(bool result) {
            if (result) {
                return 3;
            }
        } catch { }
        
        try IERC165Upgradeable(token).supportsInterface(LibRoyalties2981._INTERFACE_ID_ROYALTIES) returns(bool result) {
            if (result) {
                return 5;
            }
        } catch { }
        
        if (royaltiesProvider != address(0)) {
            return 4;
        }

        if (royaltiesByToken[token].initialized) {
            return 1;
        }

        return 6;
    }

    /// @dev returns royalties for token contract and token id
    function getRoyalties(address token, uint tokenId) override external returns (LibPart.Part[] memory) {
        uint royaltiesProviderData = royaltiesProviders[token];

        address royaltiesProvider = address(royaltiesProviderData);
        uint royaltiesType = _getRoyaltiesType(royaltiesProviderData);

        // case when royaltiesType is not set
        if (royaltiesType == 0) {
            // calculating royalties type for token
            royaltiesType = calculateRoyaltiesType(token, royaltiesProvider);
            
            //saving royalties type
            setRoyaltiesType(token, royaltiesType, royaltiesProvider);
        }

        //case royaltiesType = 1, royalties are set in royaltiesByToken
        if (royaltiesType == 1) {
            return royaltiesByToken[token].royalties;
        }

        //case royaltiesType = 2, royalties rarible v2
        if (royaltiesType == 2) {
            return getRoyaltiesRaribleV2(token,tokenId);
        }

        //case royaltiesType = 3, royalties rarible v1
        if (royaltiesType == 3) {
            return getRoyaltiesRaribleV1(token, tokenId);
        }

        //case royaltiesType = 4, royalties from external provider
        if (royaltiesType == 4) {
            return providerExtractor(token, tokenId, royaltiesProvider);
        }

        //case royaltiesType = 5, royalties EIP-2981
        if (royaltiesType == 5) {
            return getRoyaltiesEIP2981(token, tokenId);
        }

        // case royaltiesType = 6, unknown/empty royalties
        if (royaltiesType == 6) {
            return new LibPart.Part[](0);
        } 

        revert("something wrong in getRoyalties");
    }

    /// @dev tries to get royalties rarible-v2 for token and tokenId
    function getRoyaltiesRaribleV2(address token, uint tokenId) internal view returns (LibPart.Part[] memory) {
        try RoyaltiesV2(token).getRaribleV2Royalties(tokenId) returns (LibPart.Part[] memory result) {
            return result;
        } catch {
            return new LibPart.Part[](0);
        }
    }

    /// @dev tries to get royalties rarible-v1 for token and tokenId
    function getRoyaltiesRaribleV1(address token, uint tokenId) internal view returns (LibPart.Part[] memory) {
        RoyaltiesV1 v1 = RoyaltiesV1(token);
        address payable[] memory recipients;
        try v1.getFeeRecipients(tokenId) returns (address payable[] memory resultRecipients) {
            recipients = resultRecipients;
        } catch {
            return new LibPart.Part[](0);
        }
        uint[] memory values;
        try v1.getFeeBps(tokenId) returns (uint[] memory resultValues) {
            values = resultValues;
        } catch {
            return new LibPart.Part[](0);
        }
        if (values.length != recipients.length) {
            return new LibPart.Part[](0);
        }
        LibPart.Part[] memory result = new LibPart.Part[](values.length);
        for (uint256 i = 0; i < values.length; i++) {
            result[i].value = uint96(values[i]);
            result[i].account = recipients[i];
        }
        return result;
    }

    /// @dev tries to get royalties EIP-2981 for token and tokenId
    function getRoyaltiesEIP2981(address token, uint tokenId) internal view returns (LibPart.Part[] memory) {
        try IERC2981(token).royaltyInfo(tokenId, LibRoyalties2981._WEIGHT_VALUE) returns (address receiver, uint256 royaltyAmount) {
            return LibRoyalties2981.calculateRoyalties(receiver, royaltyAmount);
        } catch {
            return new LibPart.Part[](0);
        }
    }

    /// @dev tries to get royalties for token and tokenId from external provider set in royaltiesProviders
    function providerExtractor(address token, uint tokenId, address providerAddress) internal returns (LibPart.Part[] memory) {
        try IRoyaltiesProvider(providerAddress).getRoyalties(token, tokenId) returns (LibPart.Part[] memory result) {
            return result;
        } catch {
            return new LibPart.Part[](0);
        }
    }

    uint256[46] private __gap;
}
