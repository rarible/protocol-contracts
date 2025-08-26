// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { RateLimiter } from "@layerzerolabs/oapp-evm/contracts/oapp/utils/RateLimiter.sol";

interface IRateLimiter {
    function setRateLimits(RateLimiter.RateLimitConfig[] calldata _rateLimitConfigs) external ;
    function getRateLimit(uint32 _dstEid) external view returns (RateLimiter.RateLimit memory);
}