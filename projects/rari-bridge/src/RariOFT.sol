// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { RateLimiter } from "@layerzerolabs/oapp-evm/contracts/oapp/utils/RateLimiter.sol";
import { OFT } from "@layerzerolabs/oft-evm/contracts/OFT.sol";
import { IRateLimiter } from "./IRateLimiter.sol";

contract RariOFT is OFT, RateLimiter, IRateLimiter {
    constructor(
        address _layerZeroEndpoint,
        address _owner
    ) OFT("Rarible", "RARI", _layerZeroEndpoint, _owner) Ownable(_owner) {}

    // Override _debit to enforce rate limits on token transfers
    function _debit(
        address _from,
        uint256 _amountLD,
        uint256 _minAmountLD,
        uint32 _dstEid
    ) internal override returns (uint256 amountSentLD, uint256 amountReceivedLD) {
        // Check rate limit before allowing the transfer
        _outflow(_dstEid, _amountLD);

        // Proceed with normal OFT debit logic
        return super._debit(_from, _amountLD, _minAmountLD, _dstEid);
    }

    function setRateLimits(RateLimitConfig[] calldata _rateLimitConfigs) external onlyOwner {
        _setRateLimits(_rateLimitConfigs);
    }

    function getRateLimit(uint32 _dstEid) external view returns (RateLimit memory) {
        return rateLimits[_dstEid];
    }
}
