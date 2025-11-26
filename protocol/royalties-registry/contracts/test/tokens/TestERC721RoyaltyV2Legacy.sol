// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "./../royalty-registry/RoyaltiesV2LegacyImpl.sol";
contract TestERC721RoyaltyV2Legacy is ERC721Upgradeable, RoyaltiesV2LegacyImpl {
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
}
