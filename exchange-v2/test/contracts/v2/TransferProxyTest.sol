// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;

import "@rarible/exchange-interfaces/contracts/INftTransferProxy.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract TransferProxyTest is INftTransferProxy, Initializable, OwnableUpgradeable {

    function __TransferProxy_init() external initializer {
        __Ownable_init();
    }

    function erc721safeTransferFrom(IERC721Upgradeable token, address from, address to, uint256 tokenId) override external {
        token.safeTransferFrom(from, to, tokenId);
    }

    function erc1155safeTransferFrom(IERC1155Upgradeable token, address from, address to, uint256 id, uint256 value, bytes calldata data) override external {
        token.safeTransferFrom(from, to, id, value, data);
    }
}
