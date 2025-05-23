// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "./dependencies/ERC721Upgradeable.sol";
import "./dependencies/Ownable.sol";
import "./dependencies/RenderingContract.sol";
import "./dependencies/IERC4906.sol";


contract TestERC721 is ERC721Upgradeable, Ownable, RenderingContract, IERC4906 {
    constructor(string memory _name, string memory _symbol) public {
        __ERC721_init(_name, _symbol);
        _setupOwner(msg.sender);
    }

    function mint(address to, uint tokenId) external {
        _mint(to, tokenId);
    }

    function mintFromContract(address to, uint tokenId) external {
        _mintFromContract(to, tokenId);
    }

    function setBaseURI(string calldata uri) external {

    }

    function reveal(uint256 _index) external {
        emit TokenURIRevealed(_index, "test");
    }

    function getBatchIdAtIndex(uint256 _index) external view returns (uint256) {
        return 10;
    }

    function _canSetOwner() internal virtual view override returns (bool) {
        return msg.sender == owner();
    }

    function mintWithPrice(address to, uint[] memory tokenIds, address currency, uint256 pricePerToken) external {
        for (uint i = 0; i < tokenIds.length; i++) {
            _mint(to, tokenIds[i]);
        }
        IERC20Upgradeable(currency).transferFrom(msg.sender, owner(), pricePerToken * tokenIds.length);
    }

    function updateMetaData(uint256 _tokenId) external {
        emit MetadataUpdate(_tokenId);
    }

    function updateBatchMetaData(uint256 _fromTokenId, uint256 _toTokenId) external {
        emit BatchMetadataUpdate(_fromTokenId, _toTokenId);
    }

    event TokenURIRevealed(uint256 indexed index, string revealedURI);
}
