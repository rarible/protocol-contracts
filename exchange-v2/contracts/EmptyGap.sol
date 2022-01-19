// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

/*@dev for save context*/
abstract contract EmptyGap {
      uint256[50] private ___gap;
}

/*@dev for save context*/
abstract contract EmptyGap2 {
      uint256[50] private ____gap;
}

/*@dev for save context*/
abstract contract EmptyGap3 {
      uint256[50] private _____gap;
}
