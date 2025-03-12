// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../HederaAccountService.sol";
import "../../../hedera-token-service/HederaTokenService.sol";

contract CryptoAllowance is HederaAccountService, HederaTokenService {
    event ResponseCode(int responseCode);
    event HbarAllowance(address owner, address spender, int256 allowance);
    event IsAuthorizedRaw(address account, bool response);

    function hbarApprovePublic(address owner, address spender, int256 amount) public returns (int64 responseCode) {
        responseCode = HederaAccountService.hbarApprove(owner, spender, amount);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
    }

    function hbarAllowancePublic(address owner, address spender) public returns (int64 responseCode, int256 allowance) {
        (responseCode, allowance) = HederaAccountService.hbarAllowance(owner, spender);
        emit ResponseCode(responseCode);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
        emit HbarAllowance(owner, spender, allowance);
    }

    function cryptoTransferPublic(IHederaTokenService.TransferList calldata transferList, IHederaTokenService.TokenTransferList[] calldata tokenTransferList) public returns (int responseCode) {
        responseCode = HederaTokenService.cryptoTransfer(transferList, tokenTransferList);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
    }
}
