// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@rarible/royalties/contracts/test/Royalties2981TestImpl.sol";
import "@rarible/royalties/contracts/LibRoyalties2981.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
contract TestERC721WithRoyaltyV2981 is Initializable, Royalties2981TestImpl, ERC721Upgradeable, OwnableUpgradeable {
    string private _baseURIValue;
    function initialize(string memory name_, string memory symbol_, string memory baseURI_) public initializer {
        __ERC721_init(name_, symbol_);
        __Ownable_init(_msgSender());
        _baseURIValue = baseURI_;
        setRoyalties(1000);
    }
    function baseURI() external view returns (string memory) {
        return _baseURIValue;
    }
    function mint(address to, uint tokenId) external {
        _mint(to, tokenId);
    }
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == LibRoyalties2981._INTERFACE_ID_ROYALTIES || super.supportsInterface(interfaceId);
    }
}
