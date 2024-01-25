// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "../libraries/LibLooksRare.sol";

interface ILooksRare {
    function matchAskWithTakerBidUsingETHAndWETH(LibLooksRare.TakerOrder calldata takerBid, LibLooksRare.MakerOrder calldata makerAsk) external payable;

    /**
     * @notice This function allows a user to execute a taker bid (against a maker ask).
     * @param takerBid Taker bid struct
     * @param makerAsk Maker ask struct
     * @param makerSignature Maker signature
     * @param merkleTree Merkle tree struct (if the signature contains multiple maker orders)
     * @param affiliate Affiliate address
     */
    function executeTakerBid(LibLooksRare.Taker calldata takerBid, LibLooksRare.Maker calldata makerAsk, bytes calldata makerSignature, LibLooksRare.MerkleTree calldata merkleTree, address affiliate) external payable;
}
