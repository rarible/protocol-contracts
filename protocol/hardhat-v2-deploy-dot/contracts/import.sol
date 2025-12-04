// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

// Import RoyaltiesRegistry for deployment
import "@rarible/royalties-registry/contracts/RoyaltiesRegistry.sol";

// Import Transfer Proxies for deployment
import "@rarible/transfer-proxy/contracts/proxy/TransferProxy.sol";
import "@rarible/transfer-proxy/contracts/proxy/ERC20TransferProxy.sol";
import "@rarible/transfer-proxy/contracts/lazy-mint/erc721/ERC721LazyMintTransferProxy.sol";
import "@rarible/transfer-proxy/contracts/lazy-mint/erc1155/ERC1155LazyMintTransferProxy.sol";

// Import ExchangeV2 for deployment
import "@rarible/exchange-v2/contracts/ExchangeV2.sol";

// Import AssetMatcherCollection for deployment
import "@rarible/custom-matchers/contracts/AssetMatcherCollection.sol";

// Import ERC721 Token, Beacon, and Factory for deployment
import "@rarible/tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol";
import "@rarible/tokens/contracts/beacons/ERC721RaribleMinimalBeacon.sol";
import "@rarible/tokens/contracts/create-2/ERC721RaribleFactoryC2.sol";

// Import ERC1155 Token, Beacon, and Factory for deployment
import "@rarible/tokens/contracts/erc-1155/ERC1155Rarible.sol";
import "@rarible/tokens/contracts/beacons/ERC1155RaribleBeacon.sol";
import "@rarible/tokens/contracts/create-2/ERC1155RaribleFactoryC2.sol";

// Import RaribleExchangeWrapper for deployment
import "@rarible/exchange-wrapper/contracts/RaribleExchangeWrapper.sol";

// Import OpenZeppelin's TransparentUpgradeableProxy
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
