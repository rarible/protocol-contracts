// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.9.0;
pragma abicoder v2;

import "../../contracts/IERC2981.sol";

contract Royalties2981Test {
    IERC2981 immutable royalties;

    constructor(IERC2981 _royalties) {
        royalties = _royalties;
    }

    event Test(address account, uint value);

    function royaltyInfoTest(uint256 _tokenId, uint256 _salePrice) public {
        (address account, uint value) = royalties.royaltyInfo(_tokenId, _salePrice);
        emit Test(account, value);
    }
}
