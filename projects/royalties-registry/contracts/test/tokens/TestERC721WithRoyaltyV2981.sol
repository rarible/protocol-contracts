// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@rarible/royalties/test/contracts/Royalties2981TestImpl.sol";
import "@rarible/royalties/contracts/LibRoyalties2981.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract TestERC721WithRoyaltyV2981 is Initializable, Royalties2981TestImpl, ERC721Upgradeable, OwnableUpgradeable {
    function initialize() public initializer {
        _registerInterface(LibRoyalties2981._INTERFACE_ID_ROYALTIES);
        __Ownable_init_unchained();
        setRoyalties(1000);
    }
}
