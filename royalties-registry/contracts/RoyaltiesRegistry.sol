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

    event RoyaltiesSetForToken(address indexed token, uint indexed tokenId, LibPart.Part[] royalties);
    event RoyaltiesSetForContract(address indexed token, LibPart.Part[] royalties);

    struct RoyaltiesSet {
        bool initialized;
        LibPart.Part[] royalties;
    }

    mapping(bytes32 => RoyaltiesSet) public royaltiesByTokenAndTokenId;
    mapping(address => RoyaltiesSet) public royaltiesByToken;
    //stores external provider and royalties type for token contract
    mapping(address => uint) public royaltiesProviders;

    /// @dev total amount or supported royalties types
    // 1 - royaltiesByToken, 2 - v2, 3 - v1,
    // 4 - external provider, 5 - EIP-2981
    uint constant royaltiesTypesAmount = 5;

    function __RoyaltiesRegistry_init() external initializer {
        __Ownable_init_unchained();
    }

    /// @dev sets external provider for token contract, and royalties type = 4
    function setProviderByToken(address token, address provider) external {
        checkOwner(token);
        royaltiesProviders[token] = uint(provider);
        setRoyaltiesType(token, 4);
    }

    /// @dev returns provider address for token contract from royaltiesProviders mapping
    function getProvider(address token) public view returns(address) {
        return address(royaltiesProviders[token]);
    }

    /// @dev returns royalties type for token contract
    function getRoyaltiesType(address token) public view returns(uint){
        uint data = royaltiesProviders[token];
        for (uint i = 1; i <= royaltiesTypesAmount; i++){
            if (data / 2**(256-i) == 1) {
                return i;
            }
        }
        return 0;
    }

    /// @dev sets royalties type for token contract
    function setRoyaltiesType(address token, uint royaltiesType) internal {
        require(royaltiesType > 0 && royaltiesType <= royaltiesTypesAmount, "wrong royaltiesType");
        royaltiesProviders[token] = royaltiesProviders[token] + 2**(256 - royaltiesType);
    }

    /// @dev clears and sets new royalties type for token contract
    function forceSetRoyaltiesType(address token, uint royaltiesType) external {
        checkOwner(token);
        clearRoyaltiesType(token);
        setRoyaltiesType(token, royaltiesType);
    }

    /// @dev clears royalties type for token contract
    function clearRoyaltiesType(address token) public {
        royaltiesProviders[token] = uint(getProvider(token));
    }

    /// @dev sets royalties for token contract in royaltiesByToken mapping and royalties type = 1
    function setRoyaltiesByToken(address token, LibPart.Part[] memory royalties) external {
        checkOwner(token);
        //clearing royaltiesProviders value for the token
        delete royaltiesProviders[token];
        // setting royaltiesType = 1 for the token
        setRoyaltiesType(token, 1);
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

    /// @dev sets royalties for tokenId in token contract in mapping royaltiesByTokenAndTokenId
    function setRoyaltiesByTokenAndTokenId(address token, uint tokenId, LibPart.Part[] memory royalties) external {
        checkOwner(token);
        setRoyaltiesCacheByTokenAndTokenId(token, tokenId, royalties);
    }

    /// @dev checks if msg.sender is owner of this contract or owner of the token contract
    function checkOwner(address token) internal view {
        if ((owner() != _msgSender()) && (OwnableUpgradeable(token).owner() != _msgSender())) {
            revert("Token owner not detected");
        }
    }
    
    /// @dev processes different types of royalties
    function _getRoyalties(address token, uint tokenId) internal returns(LibPart.Part[] memory){
        // case when royalties for token and tokenId are set in royaltiesByTokenAndTokenId
        RoyaltiesSet memory royaltiesSet = royaltiesByTokenAndTokenId[keccak256(abi.encode(token, tokenId))];
        if (royaltiesSet.initialized) {
            return royaltiesSet.royalties;
        }

        uint royaltiesType = getRoyaltiesType(token);
        // case when royaltiesType is not set
        if (royaltiesType == 0){
            return getNewRoyalties(token, tokenId);
        }

        //case royaltiesType = 1, royalties are set in royaltiesByToken
        if (royaltiesType == 1){
            return royaltiesByToken[token].royalties;
        }

        //case royaltiesType = 2, royalties rarible v2
        if (royaltiesType == 2){
            return RoyaltiesV2(token).getRaribleV2Royalties(tokenId);
        }

        //case royaltiesType = 3, royalties rarible v1
        if (royaltiesType == 3){
            RoyaltiesV1 v1 = RoyaltiesV1(token);
            address payable[] memory recipients = v1.getFeeRecipients(tokenId);
            uint[] memory values = v1.getFeeBps(tokenId);
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

        //case royaltiesType = 4, royalties from external provider
        if (royaltiesType == 4){
            return IRoyaltiesProvider(getProvider(token)).getRoyalties(token, tokenId);
        }

        //case royaltiesType = 5, royalties EIP-2981
        if (royaltiesType == 5){
            (address receiver, uint256 royaltyAmount) = IERC2981(token).royaltyInfo(tokenId, LibRoyalties2981._WEIGHT_VALUE);
            return LibRoyalties2981.calculateRoyalties(receiver, royaltyAmount);
        }

        revert("something wrong in _getRoyalties");
    }

    /// @dev gets royalties from contract if royalties type is unset (= 0) 
    function getNewRoyalties(address token, uint tokenId) internal returns(LibPart.Part[] memory){
        LibPart.Part[] memory resultRoyalties;
        uint royaltiesType;

        //try royaltiesByToken
        RoyaltiesSet memory royaltiesSet = royaltiesByToken[token];
        if (royaltiesSet.initialized) {
            resultRoyalties = royaltiesSet.royalties;
            royaltiesType = 1;
        }

        //try external provider
        if (royaltiesType == 0) {
            (resultRoyalties, royaltiesType) = providerExtractor(token, tokenId);
        }

        //rarible royalties-v2
        if (royaltiesType == 0) {
            (resultRoyalties, royaltiesType) = getRoyaltiesRaribleV2(token, tokenId);
        }

        //rarible royalties-v1
        if (royaltiesType == 0) {
            (resultRoyalties, royaltiesType) = getRoyaltiesRaribleV1(token, tokenId);
        }

        //eip-2981
        if (royaltiesType == 0) {
            (resultRoyalties, royaltiesType) = getRoyaltiesEIP2981(token, tokenId);
        }

        //save royalties type
        if (royaltiesType > 0) {
            setRoyaltiesType(token, royaltiesType);
        }
        return resultRoyalties;
    }

    /// @dev return royalties for token contract and token id
    function getRoyalties(address token, uint tokenId) override external returns (LibPart.Part[] memory resultRoyalties) {
        resultRoyalties =  _getRoyalties(token, tokenId);
        setRoyaltiesCacheByTokenAndTokenId(token, tokenId, resultRoyalties);
    }

    /// @dev saves royalties in royaltiesByTokenAndTokenId mapping after getting it from token contract 
    function setRoyaltiesCacheByTokenAndTokenId(address token, uint tokenId, LibPart.Part[] memory royalties) internal {
        uint sumRoyalties = 0;
        bytes32 key = keccak256(abi.encode(token, tokenId));
        delete royaltiesByTokenAndTokenId[key].royalties;
        for (uint i = 0; i < royalties.length; i++) {
            require(royalties[i].account != address(0x0), "RoyaltiesByTokenAndTokenId recipient should be present");
            require(royalties[i].value != 0, "Royalty value for RoyaltiesByTokenAndTokenId should be > 0");
            royaltiesByTokenAndTokenId[key].royalties.push(royalties[i]);
            sumRoyalties += royalties[i].value;
        }
        require(sumRoyalties < 10000, "Set by token and tokenId royalties sum more, than 100%");
        royaltiesByTokenAndTokenId[key].initialized = true;
        emit RoyaltiesSetForToken(token, tokenId, royalties);
    }

    /// @dev tries to get royalties rarible-v2 for token and tokenId
    function getRoyaltiesRaribleV2(address token, uint tokenId) internal view returns (LibPart.Part[] memory, uint){
        if (IERC165Upgradeable(token).supportsInterface(LibRoyaltiesV2._INTERFACE_ID_ROYALTIES)) {
            RoyaltiesV2 v2 = RoyaltiesV2(token);
            try v2.getRaribleV2Royalties(tokenId) returns (LibPart.Part[] memory result) {
                return (result, 2);
            } catch {
                return (new LibPart.Part[](0), 0);
            }
        }
        return (new LibPart.Part[](0), 0);
    }

    /// @dev tries to get royalties rarible-v1 for token and tokenId
    function getRoyaltiesRaribleV1(address token, uint tokenId) internal view returns (LibPart.Part[] memory, uint){
        RoyaltiesV1 v1 = RoyaltiesV1(token);
        address payable[] memory recipients;
        try v1.getFeeRecipients(tokenId) returns (address payable[] memory resultRecipients) {
            recipients = resultRecipients;
        } catch {
            return (new LibPart.Part[](0), 0);
        }
        uint[] memory values;
        try v1.getFeeBps(tokenId) returns (uint[] memory resultValues) {
            values = resultValues;
        } catch {
            return (new LibPart.Part[](0), 0);
        }
        if (values.length != recipients.length) {
            return (new LibPart.Part[](0), 3);
        }
        LibPart.Part[] memory result = new LibPart.Part[](values.length);
        for (uint256 i = 0; i < values.length; i++) {
            result[i].value = uint96(values[i]);
            result[i].account = recipients[i];
        }
        return (result, 3);
    }

    /// @dev tries to get royalties EIP-2981 for token and tokenId
    function getRoyaltiesEIP2981(address token, uint tokenId) internal view returns (LibPart.Part[] memory, uint) {
        if (IERC165Upgradeable(token).supportsInterface(LibRoyalties2981._INTERFACE_ID_ROYALTIES)) {
            IERC2981 v2981 = IERC2981(token);
            try v2981.royaltyInfo(tokenId, LibRoyalties2981._WEIGHT_VALUE) returns (address receiver, uint256 royaltyAmount) {
                return (LibRoyalties2981.calculateRoyalties(receiver, royaltyAmount), 5);
            } catch {
                return (new LibPart.Part[](0), 0);
            }
        }
        return (new LibPart.Part[](0), 0);
    }

    /// @dev tries to get royalties for token and tokenId from external provider set in royaltiesProviders
    function providerExtractor(address token, uint tokenId) internal returns (LibPart.Part[] memory royalties, uint royaltiesType) {
        royaltiesType = 0;
        address providerAddress = getProvider(token);
        if (providerAddress != address(0x0)) {
            IRoyaltiesProvider provider = IRoyaltiesProvider(providerAddress);
            try provider.getRoyalties(token, tokenId) returns (LibPart.Part[] memory royaltiesByProvider) {
                royalties = royaltiesByProvider;
                royaltiesType = 4;
            } catch {}
        }
    }

    uint256[46] private __gap;
}
