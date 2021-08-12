// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "@rarible/exchange-interfaces/contracts/ITransferProxy.sol";
import "../roles/OperatorRole.sol";
import "./ICryptoPunkMarket.sol";

contract PunkTransferProxy is Initializable, OperatorRole, ITransferProxy {

    function __PunkTransferProxy_init() external initializer {
        __Ownable_init();
    }

    function transfer(LibAsset.Asset memory asset, address from, address to) override onlyOperator external {
        (address token, uint punkIndex) = abi.decode(asset.assetType.data, (address, uint));
//        require(asset.value == 1, "erc721 value error"); //todo: think need or not
        ICryptoPunkMarket(token).buyPunk(punkIndex);
        ICryptoPunkMarket(token).transferPunk(to, punkIndex);
    }
}