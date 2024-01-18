// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

library LibRoyaltiesV1 {
    /*
     * bytes4(keccak256('getFeeBps(uint256)')) == 0x0ebd4c7f
     * bytes4(keccak256('getFeeRecipients(uint256)')) == 0xb9c4d9fb
     *
     * => 0x0ebd4c7f ^ 0xb9c4d9fb == 0xb7799584
     */
    bytes4 constant _INTERFACE_ID_FEES = 0xb7799584;
}
