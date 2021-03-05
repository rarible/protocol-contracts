// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./ExchangeV2Core.sol";
import "./SimpleTransferManager.sol";

contract ExchangeSimpleV2 is ExchangeV2Core, SimpleTransferManager {
}
