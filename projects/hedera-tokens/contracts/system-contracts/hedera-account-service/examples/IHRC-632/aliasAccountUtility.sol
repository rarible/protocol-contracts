// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../HederaAccountService.sol";


contract AliasAccountUtility is HederaAccountService { 
    event ResponseCode(int responseCode);
    event AccountAuthorizationResponse(int64 responseCode, address account, bool response);
    event AddressAliasResponse(int64 responseCode, address evmAddressAlias);
    event IsValidAliasResponse(int64 responseCode, bool response);



    /// Returns the EVM address alias for a given Hedera account.
    /// @param accountNumAlias The Hedera account number alias to lookup. Must satisfy all of the following:
    ///                         - Must be in long-zero format (0x000...0<account_num>)
    ///                         - Must reference an existing Hedera account
    ///                         - Referenced account must have an associated EVM address alias
    /// @return responseCode The response code indicating the status of the request:
    ///                         - SUCCESS (22) if successful
    ///                         - INVALID_ACCOUNT_ID (15) if any validation of the accountNumAlias fails
    /// @return evmAddressAlias The EVM address alias associated with the Hedera account, or address(0) if the request fails
    function getEvmAddressAliasPublic(address accountNumAlias) public returns (int64 responseCode, address evmAddressAlias) 
    {
        (responseCode, evmAddressAlias) = HederaAccountService.getEvmAddressAlias(accountNumAlias);
        emit AddressAliasResponse(responseCode, evmAddressAlias);
        if (responseCode != HederaResponseCodes.SUCCESS && responseCode != HederaResponseCodes.INVALID_ACCOUNT_ID) {
            revert();
        }
    }

    /// Returns the Hedera Account ID (as account num alias) for the given EVM address alias
    /// @param evmAddressAlias The EVM address alias to get the Hedera account for. Must satisfy all of the following:
    ///                         - Must be in EVM format (not a long-zero address)
    ///                         - Must reference an existing Hedera account
    ///                         - Referenced account must have an associated account num alias (long-zero format)
    /// @return responseCode The response code indicating the status of the request:
    ///                         - SUCCESS (22) if successful
    ///                         - INVALID_SOLIDITY_ADDRESS (29) if any validation of the evmAddressAlias fails
    /// @return accountNumAlias The Hedera account's num alias in long-zero format, or address(0) if the request fails
    function getHederaAccountNumAliasPublic(address evmAddressAlias) public returns (int64 responseCode, address accountNumAlias) {
        (responseCode, accountNumAlias) = HederaAccountService.getHederaAccountNumAlias(evmAddressAlias);
        emit AddressAliasResponse(responseCode, accountNumAlias);
        if (responseCode != HederaResponseCodes.SUCCESS && responseCode != HederaResponseCodes.INVALID_SOLIDITY_ADDRESS) {
            revert();
        }
    }

    /// Returns true iff a Hedera account num alias or EVM address alias.
    /// @param addr Some 20-byte address.
    /// @return responseCode The response code for the status of the request. SUCCESS is 22.
    /// @return response true iff addr is a Hedera account num alias or an EVM address alias (and false otherwise).
    function isValidAliasPublic(address addr) public returns (int64 responseCode, bool response) {
        (responseCode, response) = HederaAccountService.isValidAlias(addr);
        emit IsValidAliasResponse(responseCode, response);
        if (responseCode != HederaResponseCodes.SUCCESS && responseCode != HederaResponseCodes.INVALID_SOLIDITY_ADDRESS) {
            revert();
        }
    }

    /// @notice Verifies if a signature was signed by the account's key(s)
    /// @param account The account address to verify the signature against
    /// @param messageHash The hash of the message that was signed
    /// @param signature The signature to verify
    /// @return responseCode The response code indicating success or failure
    /// @return authorized True if the signature is valid for the account, false otherwise
    function isAuthorizedRawPublic(address account, bytes memory messageHash, bytes memory signature) public returns (int64 responseCode, bool authorized) {
        (responseCode, authorized) = HederaAccountService.isAuthorizedRaw(account, messageHash, signature);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
        emit AccountAuthorizationResponse(responseCode, account, authorized);
    }


    /// Determines if the signature is valid for the given message and account.
    /// It is assumed that the signature is composed of a possibly complex cryptographic key.
    /// @param account The account to check the signature against.
    /// @param message The message to check the signature against.
    /// @param signature The signature to check encoded as bytes.
    /// @return responseCode The response code for the status of the request.  SUCCESS is 22.
    /// @return authorized True if the signature is valid, false otherwise.
    function isAuthorizedPublic(address account, bytes memory message, bytes memory signature) public returns (int64 responseCode, bool authorized) {
        (responseCode, authorized) = HederaAccountService.isAuthorized(account, message, signature);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
        emit AccountAuthorizationResponse(responseCode, account, authorized);
    }
}
