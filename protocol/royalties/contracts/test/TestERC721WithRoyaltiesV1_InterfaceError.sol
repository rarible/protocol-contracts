// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../contracts/LibRoyaltiesV1.sol";
import "../../contracts/RoyaltiesV1.sol";
import "../../contracts/impl/AbstractRoyalties.sol";

contract TestERC721WithRoyaltiesV1_InterfaceError is Initializable, AbstractRoyalties, RoyaltiesV1, ERC721Upgradeable {
    function mint(address to, uint tokenId, LibPart.Part[] memory _fees) external {
        _registerInterface(LibRoyaltiesV1._INTERFACE_ID_FEES);
        _mint(to, tokenId);
        _saveRoyalties(tokenId, _fees);
    }

    function getFeeRecipients(uint256) public pure override returns (address payable[] memory) {
        revert("getFeeRecipients failed");
    }

    function getFeeBps(uint256) public pure override returns (uint[] memory) {
        revert("getFeeBps failed");
    }

    function _onRoyaltiesSet(uint256 _id, LibPart.Part[] memory _fees) internal override {}
}
