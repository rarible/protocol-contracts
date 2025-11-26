// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./dependencies/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./dependencies/RenderingContract.sol";
import "@openzeppelin/contracts/interfaces/IERC4906.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// <ai_context> Test ERC721 token with upgradeable features, royalties, and rendering. Used in royalties registry tests. Updated to use proper initialization for upgradeable contracts: constructor disables initializers, and initialize() sets name/symbol/owner. </ai_context>
contract TestERC721 is ERC721Upgradeable, OwnableUpgradeable, RenderingContract, IERC4906 {

    constructor() {
        _disableInitializers();
    }

    function initialize(string memory _name, string memory _symbol) public initializer {
        __ERC721_init(_name, _symbol);
        __Ownable_init(_msgSender());
    }
    function mint(address to, uint tokenId) external {
        _mint(to, tokenId);
    }
    function mintFromContract(address to, uint tokenId) external {
        _mintFromContract(to, tokenId);
    }
    function setBaseURI(string calldata uri) external {}
    function reveal(uint256 _index) external {
        emit TokenURIRevealed(_index, "test");
    }
    function getBatchIdAtIndex(uint256) external view returns (uint256) {
        return 10;
    }
    function _canSetOwner() internal view virtual returns (bool) {
        return _msgSender() == owner();
    }
    function mintWithPrice(address to, uint[] memory tokenIds, address currency, uint256 pricePerToken) external {
        for (uint i = 0; i < tokenIds.length; i++) {
            _mint(to, tokenIds[i]);
        }
        IERC20(currency).transferFrom(msg.sender, owner(), pricePerToken * tokenIds.length);
    }
    function updateMetaData(uint256 _tokenId) external {
        emit MetadataUpdate(_tokenId);
    }
    function updateBatchMetaData(uint256 _fromTokenId, uint256 _toTokenId) external {
        emit BatchMetadataUpdate(_fromTokenId, _toTokenId);
    }
    event TokenURIRevealed(uint256 indexed index, string revealedURI);
}