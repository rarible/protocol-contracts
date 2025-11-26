// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol";
import "@rarible/royalties/contracts/LibRoyaltiesV2.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
contract TestERC721WithRoyaltiesV2OwnableUpgradeable is
    Initializable,
    RoyaltiesV2Impl,
    ERC721Upgradeable,
    OwnableUpgradeable
{
    string private _baseURIValue;
    function initialize(string memory name_, string memory symbol_, string memory baseURI_) public initializer {
        __ERC721_init(name_, symbol_);
        __Ownable_init(_msgSender());
        _baseURIValue = baseURI_;
    }
    function baseURI() external view returns (string memory) {
        return _baseURIValue;
    }
    function mint(address to, uint tokenId, LibPart.Part[] memory _fees) external {
        _mint(to, tokenId);
        _saveRoyalties(tokenId, _fees);
    }
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == LibRoyaltiesV2._INTERFACE_ID_ROYALTIES || super.supportsInterface(interfaceId);
    }
}
