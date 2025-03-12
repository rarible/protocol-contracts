// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../HederaAccountService.sol";
import "../../../hedera-token-service/HederaTokenService.sol";

interface ICryptoAllowance {
    function cryptoTransferPublic(IHederaTokenService.TransferList calldata transferList, IHederaTokenService.TokenTransferList[] calldata tokenTransferList) external returns (int responseCode);
}

contract CryptoOwner is HederaAccountService {
    receive() external payable {}

    event ResponseCode(int responseCode);
    function cryptoTransfer(address _cryptoAllowance, int64 amount, address receiver) external returns(int64 responseCode) {
        // check if fund is sufficient for transfer
        uint contractBalance = address(this).balance;
        require(uint64(amount) <= contractBalance, "Insufficient Fund");

        // approve hbar usin HederaAccountService, i.e. HIP-906
        int64 approveResponseCode = HederaAccountService.hbarApprove(address(this), _cryptoAllowance, amount);
        if (approveResponseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        // prepare IHTS.AccountAmount[]
        IHederaTokenService.AccountAmount[] memory accountAmounts = new IHederaTokenService.AccountAmount[](2);
        accountAmounts[0] = IHederaTokenService.AccountAmount({
            accountID: address(this),
            amount: amount * -1,
            isApproval: false
        });

        accountAmounts[1] = IHederaTokenService.AccountAmount({
            accountID: receiver,
            amount: amount,
            isApproval: false
        });

        // prepare IHTS.TransferList
        IHederaTokenService.TransferList memory transferList = IHederaTokenService.TransferList({
            transfers: accountAmounts
        });
        
        // prepare IHTS.TokenTransferList
        IHederaTokenService.TokenTransferList[] memory tokenTransferList = new IHederaTokenService.TokenTransferList[](0);

        // call `cryptoTransferPublic` from _cryptoAllowance
        (bool success, bytes memory data) = _cryptoAllowance.call(abi.encodeWithSelector(ICryptoAllowance.cryptoTransferPublic.selector, transferList, tokenTransferList));

        if (success != true) {
            revert();
        }

        responseCode = abi.decode(data, (int64));
        emit ResponseCode(responseCode);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
    }
}
