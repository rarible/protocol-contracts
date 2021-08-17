// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "@rarible/exchange-interfaces/contracts/ITransferProxy.sol";
import "../roles/OperatorRole.sol";
import "./ICryptoPunksMarket.sol";

contract PunkTransferProxy is ITransferProxy {

    function transfer(LibAsset.Asset memory asset, address from, address to) override external {
        (address token, uint punkIndex) = abi.decode(asset.assetType.data, (address, uint));
        //check punk from real owner
        require(ICryptoPunksMarket(token).punkIndexToAddress(punkIndex) == from, "Seller not punk owner");
        //buy punk to proxy, now proxy is owner
        ICryptoPunksMarket(token).buyPunk(punkIndex);
        //Transfer ownership of a punk to buyer
        ICryptoPunksMarket(token).transferPunk(to, punkIndex);
    }
}