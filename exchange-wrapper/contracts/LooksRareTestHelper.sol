// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import {LibLooksRare} from "./libraries/LibLooksRare.sol";

interface IExecutionStrategy {
    function canExecuteTakerAsk(LibLooksRare.TakerOrder calldata takerAsk, LibLooksRare.MakerOrder calldata makerBid)
    external
    view
    returns (
        bool,
        uint256,
        uint256
    );

    function canExecuteTakerBid(LibLooksRare.TakerOrder calldata takerBid, LibLooksRare.MakerOrder calldata makerAsk)
    external
    view
    returns (
        bool,
        uint256,
        uint256
    );

    function viewProtocolFee() external view returns (uint256);
}
/**
 * @title StrategyStandardSaleForFixedPrice
 * @notice Strategy that executes an order at a fixed price that
 * can be taken either by a bid or an ask.
 */
contract LooksRareTestHelper is IExecutionStrategy {
    uint256 public immutable PROTOCOL_FEE;

    /**
     * @notice Constructor
     * @param _protocolFee protocol fee (200 --> 2%, 400 --> 4%)
     */
    constructor(uint256 _protocolFee) {
        PROTOCOL_FEE = _protocolFee;
    }

    /**
     * @notice Check whether a taker ask order can be executed against a maker bid
     * @param takerAsk taker ask order
     * @param makerBid maker bid order
     * @return (whether strategy can be executed, tokenId to execute, amount of tokens to execute)
     */
    function canExecuteTakerAsk(LibLooksRare.TakerOrder calldata takerAsk, LibLooksRare.MakerOrder calldata makerBid)
    external
    view
    override
    returns (
        bool,
        uint256,
        uint256
    )
    {
        return (
        ((makerBid.price == takerAsk.price) &&
        (makerBid.tokenId == takerAsk.tokenId) &&
        (makerBid.startTime <= block.timestamp) &&
        (makerBid.endTime >= block.timestamp)),
        makerBid.tokenId,
        makerBid.amount
        );
    }

    /**
     * @notice Check whether a taker bid order can be executed against a maker ask
     * @param takerBid taker bid order
     * @param makerAsk maker ask order
     * @return (whether strategy can be executed, tokenId to execute, amount of tokens to execute)
     */
    function canExecuteTakerBid(LibLooksRare.TakerOrder calldata takerBid, LibLooksRare.MakerOrder calldata makerAsk)
    external
    view
    override
    returns (
        bool,
        uint256,
        uint256
    )
    {
        return (
        ((makerAsk.price == takerBid.price) &&
        (makerAsk.tokenId == takerBid.tokenId) &&
        (makerAsk.startTime <= block.timestamp) &&
        (makerAsk.endTime >= block.timestamp)),
        makerAsk.tokenId,
        makerAsk.amount
        );
    }

    function viewProtocolFee() external view override returns (uint256) {
        return 0;
    }
}
