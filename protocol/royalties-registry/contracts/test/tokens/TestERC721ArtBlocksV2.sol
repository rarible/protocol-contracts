// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "../../../contracts/providers/RoyaltyArtBlocksV2.sol";
contract TestERC721ArtBlocksV2 is ERC721Upgradeable, RoyaltyArtBlocksV2 {
    mapping(uint256 => address payable[]) public _recipients;
    mapping(uint256 => uint[]) public _bps;
    string private _baseURIValue;
    function initialize(string memory name_, string memory symbol_, string memory baseURI_) public initializer {
        __ERC721_init(name_, symbol_);
        _baseURIValue = baseURI_;
    }
    function baseURI() external view returns (string memory) {
        return _baseURIValue;
    }
    function mint(address to, uint tokenId) external {
        _mint(to, tokenId);
    }
    function setRoyalties(uint256 tokenId, address payable[] memory recipients, uint256[] memory bps) external {
        _recipients[tokenId] = recipients;
        _bps[tokenId] = bps;
    }
    function getRoyalties(
        uint256 _tokenId
    ) external view override returns (address payable[] memory recipients, uint256[] memory bps) {
        recipients = _recipients[_tokenId];
        bps = _bps[_tokenId];
    }
}
