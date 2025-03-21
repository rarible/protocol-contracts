// SPDX-License-Identifier: MIT

pragma solidity >=0.7.6 <0.8.0;

import "@rarible/role-operator/contracts/OperatorRole.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract UnsafeTransferProxyHedera is Initializable, OperatorRole {

    function __UnsafeTransferProxyHedera_init() external initializer {
        __Ownable_init();
    }

    function erc721safeTransferFrom(address token, address from, address to, uint256 tokenId) external onlyOperator {
        IERC721(token).transferFrom(from, to, tokenId);
    }

}
