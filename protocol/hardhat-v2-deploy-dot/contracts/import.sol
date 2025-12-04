// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

// Import RoyaltiesRegistry for deployment
import "@rarible/royalties-registry/contracts/RoyaltiesRegistry.sol";

// Import Transfer Proxies for deployment
import "@rarible/transfer-proxy/contracts/proxy/TransferProxy.sol";
import "@rarible/transfer-proxy/contracts/proxy/ERC20TransferProxy.sol";
import "@rarible/transfer-proxy/contracts/lazy-mint/erc721/ERC721LazyMintTransferProxy.sol";
import "@rarible/transfer-proxy/contracts/lazy-mint/erc1155/ERC1155LazyMintTransferProxy.sol";

// Import OpenZeppelin's TransparentUpgradeableProxy
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
