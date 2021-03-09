pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@rarible/royalties/contracts/impl/RoyaltiesV1Impl.sol";
import "@rarible/royalties/contracts/LibRoyaltiesV1.sol";
import "@rarible/royalties/contracts/LibFee.sol";

contract TestERC721WithRoyaltiesV1 is Initializable, RoyaltiesV1Impl, ERC721Upgradeable {
    function initialize() public initializer {
        _registerInterface(LibRoyaltiesV1._INTERFACE_ID_FEES);
    }
    function mint(address to, uint tokenId, LibFee.Fee[] memory _fees) external {
        _mint(to, tokenId);
        _saveFees(tokenId, _fees);
    }
}
