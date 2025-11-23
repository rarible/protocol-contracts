// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../contracts/impl/RoyaltiesV1Impl.sol";
import "../../contracts/LibRoyaltiesV1.sol";

contract TestERC1155RoyaltiesV1 is Initializable, RoyaltiesV1Impl, ERC1155Upgradeable {
    function initialize() public initializer {
        _registerInterface(LibRoyaltiesV1._INTERFACE_ID_FEES);
    }
    function mint(address to, uint tokenId, LibPart.Part[] memory _fees, uint amount) external {
        _mint(to, tokenId, amount, "");
        _saveRoyalties(tokenId, _fees);
    }
}
