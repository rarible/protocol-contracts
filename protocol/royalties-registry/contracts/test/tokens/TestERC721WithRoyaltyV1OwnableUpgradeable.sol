// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@rarible/royalties/contracts/impl/RoyaltiesV1Impl.sol";
import "@rarible/royalties/contracts/LibRoyaltiesV1.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract TestERC721WithRoyaltiesV1OwnableUpgradeable is Initializable, RoyaltiesV1Impl, ERC721Upgradeable, OwnableUpgradeable {
    function initialize() public initializer {
        __Ownable_init(_msgSender());
    }
    function mint(address to, uint tokenId, LibPart.Part[] memory _fees) external {
        _mint(to, tokenId);
        _saveRoyalties(tokenId, _fees);
    }
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == LibRoyaltiesV1._INTERFACE_ID_FEES || super.supportsInterface(interfaceId);
    }
}
