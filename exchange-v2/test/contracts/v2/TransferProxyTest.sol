// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;

//import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
//import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "../../../contracts/roles/OperatorRole.sol";
import "../../../contracts/exchange/v2/INftTransferProxy.sol";


contract TransferProxyTest is INftTransferProxy, Initializable, OperatorRole {

    function __TransferProxy_init() external initializer {
        __Ownable_init();
    }

    function erc721safeTransferFrom(IERC721Upgradeable token, address from, address to, uint256 tokenId) override external onlyOperator {
        token.safeTransferFrom(from, to, tokenId);
    }

    function erc1155safeTransferFrom(IERC1155Upgradeable token, address from, address to, uint256 id, uint256 value, bytes calldata data) override external onlyOperator {
        token.safeTransferFrom(from, to, id, value, data);
    }
}
