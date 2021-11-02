// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "../../contracts/IERC2981.sol";

contract Royalties2981Test {
    IERC2981 immutable royalties;

    constructor(IERC2981 _royalties) {
        royalties = _royalties;
    }

    event Test(address account, uint value);

    function royaltyInfoTest(uint256 _tokenId, uint256 _salePrice) public {
//        LibPart.Part[] memory result = royalties.get2981Royalties(_tokenId, _salePrice);
//
//        for (uint i = 0; i < result.length; i++) {
//            emit Test(result[i].account, result[i].value);
//        }
        (address account, uint value) = royalties.royaltyInfo(_tokenId, _salePrice);
        emit Test(account, value);
    }
}
