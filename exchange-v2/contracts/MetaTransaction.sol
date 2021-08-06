//SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "./lib/LibEIP712MetaTransaction.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

abstract contract MetaTransaction is ContextUpgradeable {

    mapping(address => uint256) private nonces;
    bytes32 internal domainSeparator;

    function setDomainSeparator(string memory name, string memory version) external {
        domainSeparator = LibEIP712MetaTransaction.setDomainSeparator(name, version);
    }

    function executeMetaTransaction(address userAddress,
        bytes memory functionSignature, bytes32 sigR, bytes32 sigS, uint8 sigV) public payable returns (bytes memory) {
        return LibEIP712MetaTransaction._executeMetaTransaction(userAddress, nonces, domainSeparator, functionSignature, sigR, sigS, sigV);
    }

    function getNonce(address user) external view returns (uint256 nonce) {
        nonce = nonces[user];
    }

    function _msgSender() internal view virtual override returns (address payable) {
        //    function msgSender() external view returns (address) {
        return LibEIP712MetaTransaction.__msgSender();
    }
}