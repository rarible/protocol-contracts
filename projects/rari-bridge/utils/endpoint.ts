// src/lz/chainIdToEndpointV2.ts
import {
    MainnetV2EndpointId,
    TestnetV2EndpointId,
    SandboxV2EndpointId,
    type EndpointId,
    endpointIdToStage,
  } from "@layerzerolabs/lz-definitions";
  
  type EndpointV2Id = MainnetV2EndpointId | TestnetV2EndpointId | SandboxV2EndpointId;
  
  /**
   * EVM chainId -> LayerZero Endpoint V2 ID
   * Extend this map as needed.
   */
  export const CHAIN_ID_TO_ENDPOINT_V2: Record<number, EndpointV2Id> = {
    // ===== Ethereum family =====
    1: MainnetV2EndpointId.ETHEREUM_V2_MAINNET,
    11155111: TestnetV2EndpointId.SEPOLIA_V2_TESTNET,
    17000: TestnetV2EndpointId.HOLESKY_V2_TESTNET,
    5: TestnetV2EndpointId.ETHEREUM_V2_TESTNET,      // legacy Goerli (if you still use it)
  
    // ===== Base =====
    8453: MainnetV2EndpointId.BASE_V2_MAINNET,
    84532: TestnetV2EndpointId.BASESEP_V2_TESTNET,   // Base Sepolia
    84531: TestnetV2EndpointId.BASE_V2_TESTNET,      // legacy Base Goerli
  
    // ===== Arbitrum =====
    42161: MainnetV2EndpointId.ARBITRUM_V2_MAINNET,
    42170: MainnetV2EndpointId.NOVA_V2_MAINNET,      // Arbitrum Nova
    421614: TestnetV2EndpointId.ARBSEP_V2_TESTNET,   // Arbitrum Sepolia
    421613: TestnetV2EndpointId.ARBITRUM_V2_TESTNET, // legacy Arbitrum Goerli
  
    // ===== Optimism =====
    10: MainnetV2EndpointId.OPTIMISM_V2_MAINNET,
    11155420: TestnetV2EndpointId.OPTSEP_V2_TESTNET, // Optimism Sepolia
    420: TestnetV2EndpointId.OPTIMISM_V2_TESTNET,    // legacy Optimism Goerli
  
    // ===== Polygon (POS + zkEVM) =====
    137: MainnetV2EndpointId.POLYGON_V2_MAINNET,
    80002: TestnetV2EndpointId.AMOY_V2_TESTNET,      // Polygon Amoy
    80001: TestnetV2EndpointId.POLYGON_V2_TESTNET,   // legacy Mumbai
    1101: MainnetV2EndpointId.ZKPOLYGON_V2_MAINNET,
    // 2442: TestnetV2EndpointId.ZKPOLYGONSEP_V2_TESTNET, // Polygon zkEVM Sepolia (add if you use it)
  
    // ===== zkSync =====
    324: MainnetV2EndpointId.ZKSYNC_V2_MAINNET,
    300: TestnetV2EndpointId.ZKSYNC_V2_TESTNET,      // zkSync Sepolia
  
    // ===== Linea (zkConsensys) =====
    59144: MainnetV2EndpointId.ZKCONSENSYS_V2_MAINNET,
    59141: TestnetV2EndpointId.LINEASEP_V2_TESTNET,  // Linea Sepolia
  
    // ===== Scroll =====
    534352: MainnetV2EndpointId.SCROLL_V2_MAINNET,
    534351: TestnetV2EndpointId.SCROLL_V2_TESTNET,   // Scroll Sepolia
  
    // ===== Avalanche =====
    43114: MainnetV2EndpointId.AVALANCHE_V2_MAINNET,
    43113: TestnetV2EndpointId.AVALANCHE_V2_TESTNET, // Fuji
  
    // ===== BNB Chain =====
    56: MainnetV2EndpointId.BSC_V2_MAINNET,
    97: TestnetV2EndpointId.BSC_V2_TESTNET,
  
    // ===== Gnosis =====
    100: MainnetV2EndpointId.GNOSIS_V2_MAINNET,
    10200: TestnetV2EndpointId.GNOSIS_V2_TESTNET,    // Chiado
  
    // ===== CELO =====
    42220: MainnetV2EndpointId.CELO_V2_MAINNET,
    44787: TestnetV2EndpointId.CELO_V2_TESTNET,      // Alfajores
  
    // ===== Moonbeam =====
    1284: MainnetV2EndpointId.MOONBEAM_V2_MAINNET,
    1287: TestnetV2EndpointId.MOONBEAM_V2_TESTNET,   // Moonbase Alpha
    1285: MainnetV2EndpointId.MOONRIVER_V2_MAINNET,
  
    // ===== Fantom =====
    250: MainnetV2EndpointId.FANTOM_V2_MAINNET,
    4002: TestnetV2EndpointId.FANTOM_V2_TESTNET,
  
    // ===== Zora =====
    7777777: MainnetV2EndpointId.ZORA_V2_MAINNET,
    999_999_999: TestnetV2EndpointId.ZORASEP_V2_TESTNET, // Zora Sepolia
  
    // ===== Blast =====
    81457: MainnetV2EndpointId.BLAST_V2_MAINNET,
    168587773: TestnetV2EndpointId.BLAST_V2_TESTNET, // Blast Sepolia
  
    // ===== Mantle =====
    5000: MainnetV2EndpointId.MANTLE_V2_MAINNET,
    5001: TestnetV2EndpointId.MANTLE_V2_TESTNET,     // legacy testnet
    5003: TestnetV2EndpointId.MANTLESEP_V2_TESTNET,  // Mantle Sepolia
  
    // ===== opBNB =====
    204: MainnetV2EndpointId.OPBNB_V2_MAINNET,
    5611: TestnetV2EndpointId.OPBNB_V2_TESTNET,
  
    // ===== Telos =====
    40: MainnetV2EndpointId.TELOS_V2_MAINNET,
    41: TestnetV2EndpointId.TELOS_V2_TESTNET,
  
    // ===== Klaytn =====
    8217: MainnetV2EndpointId.KLAYTN_V2_MAINNET,
    1001: TestnetV2EndpointId.KLAYTN_V2_TESTNET,

    // ===== Berachain =====
    80094: MainnetV2EndpointId.BERA_V2_MAINNET,
    80069: TestnetV2EndpointId.BERA_V2_TESTNET,
  };
  
  /**
   * Return the LayerZero V2 EndpointId for a given EVM chainId.
   * Throws if the chainId isn't mapped.
   */
  export function getEndpointV2IdByChainId(chainId: number): EndpointV2Id {
    const id = CHAIN_ID_TO_ENDPOINT_V2[chainId];
    if (!id) {
      throw new Error(`No LayerZero V2 EndpointId mapping for chainId=${chainId}`);
    }
    return id;
  }
  
  /** Safe variant that returns undefined when not found. */
  export function tryGetEndpointV2IdByChainId(chainId: number): EndpointV2Id | undefined {
    return CHAIN_ID_TO_ENDPOINT_V2[chainId];
  }
  
  /** Optional helper if you want to know the stage (mainnet/testnet/sandbox) of a resolved EndpointId. */
  export function getStageForEndpointV2Id(id: EndpointV2Id) {
    return endpointIdToStage(id as EndpointId);
  }