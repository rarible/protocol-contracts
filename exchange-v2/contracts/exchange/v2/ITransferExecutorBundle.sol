// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "./LibBundle.sol";

abstract contract ITransferExecutorBundle {

//TODO: think need event?

    function transferBundle(
        LibBundle.Bundle memory bundle,
        address from,
        address to,
        bytes4 transferDirection,
        bytes4 transferType
    ) internal virtual;
}
