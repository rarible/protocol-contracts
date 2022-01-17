// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "./LibFeeSide.sol";
import "./LibOrder.sol";

library LibFee {
    /// @dev struct that stores protocolFee for both orders in a match
    struct MatchFees {
        uint feeSideProtocolFee;
        uint nftSideProtocolFee;
        LibFeeSide.FeeSide feeSide;
    }
}
