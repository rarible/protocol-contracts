// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../libraries/LibLooksRare.sol";

interface ILooksRare {
    function matchAskWithTakerBidUsingETHAndWETH(
        LibLooksRare.TakerOrder calldata takerBid,
        LibLooksRare.MakerOrder calldata makerAsk
    ) external payable;
}