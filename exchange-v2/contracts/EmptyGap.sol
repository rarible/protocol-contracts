// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

/*@dev for save context*/
abstract contract EmptyGap {
      function emptyDo() public view returns(uint) {
            return 0;
      }
      uint256[50] private ___gap;
}

/*@dev for save context*/
abstract contract EmptyGap2 {
      function emptyDo2() public view returns(uint) {
            return 0;
      }
      uint256[50] private ____gap;
}
