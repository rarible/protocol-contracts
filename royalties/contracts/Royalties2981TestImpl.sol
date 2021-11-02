// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./IERC2981.sol";

contract Royalties2981TestImpl is IERC2981 {

    function royaltyInfo(uint256 _tokenId, uint256 _salePrice) override external view returns (address receiver, uint256 royaltyAmount) {
        receiver = address(_tokenId >> 96);
        royaltyAmount = _salePrice/10;
    }
}
