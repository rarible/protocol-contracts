// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

//tokens 721
import {ERC721Rarible} from "@rarible/tokens/contracts/erc-721/ERC721Rarible.sol";
import {ERC721RaribleMinimal} from "@rarible/tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol";
import {ERC721RaribleFactoryC2} from "@rarible/tokens/contracts/create-2/ERC721RaribleFactoryC2.sol";
import {ERC721RaribleFactoryC2OwnerManaged} from "@rarible/tokens/contracts/create-2/ERC721RaribleFactoryC2OwnerManaged.sol";

//tokens 1155
import {ERC1155Rarible} from "@rarible/tokens/contracts/erc-1155/ERC1155Rarible.sol";
import {ERC1155RaribleFactoryC2} from "@rarible/tokens/contracts/create-2/ERC1155RaribleFactoryC2.sol";
import {ERC1155RaribleFactoryC2OwnerManaged} from "@rarible/tokens/contracts/create-2/ERC1155RaribleFactoryC2OwnerManaged.sol";

//meta tokens
import {ERC721RaribleMeta} from "@rarible/tokens/contracts/erc-721-minimal/erc-721-minimal-meta/ERC721RaribleMeta.sol";
import {ERC1155RaribleMeta} from "@rarible/tokens/contracts/erc-1155/erc-1155-meta/ERC1155RaribleMeta.sol";

//beacons
import {ERC1155RaribleBeacon} from "@rarible/tokens/contracts/beacons/ERC1155RaribleBeacon.sol";
import {ERC1155RaribleBeaconOwnerManaged} from "@rarible/tokens/contracts/beacons/ERC1155RaribleBeaconOwnerManaged.sol";
import {ERC721RaribleMinimalBeacon} from "@rarible/tokens/contracts/beacons/ERC721RaribleMinimalBeacon.sol";
import {ERC721RaribleBeacon} from "@rarible/tokens/contracts/beacons/ERC721RaribleBeacon.sol";
import {ERC721RaribleMinimalBeaconOwnerManaged} from "@rarible/tokens/contracts/beacons/ERC721RaribleMinimalBeaconOwnerManaged.sol";
import {ERC1155RaribleBeaconMeta} from "@rarible/tokens/contracts/beacons/ERC1155RaribleBeaconMeta.sol";
import {ERC1155RaribleBeaconMetaOwnerManaged} from "@rarible/tokens/contracts/beacons/ERC1155RaribleBeaconMetaOwnerManaged.sol";
import {ERC721RaribleMinimalBeaconMeta} from "@rarible/tokens/contracts/beacons/ERC721RaribleMinimalBeaconMeta.sol";
import {ERC721RaribleMinimalBeaconMetaOwnerManaged} from "@rarible/tokens/contracts/beacons/ERC721RaribleMinimalBeaconMetaOwnerManaged.sol";

import { TestERC20 } from "@rarible/test/contracts/TestERC20.sol";
