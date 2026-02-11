export const DETERMENISTIC_DEPLOYMENT_SALT: string =
  process.env.DETERMENISTIC_DEPLOYMENT_SALT || "0x1118";

/**
 * Base Mainnet USDC address
 */
export const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

/**
 * Base Sepolia USDC address
 */
export const BASE_SEPOLIA_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

/**
 * Default fee basis points (5%)
 */
export const DEFAULT_FEE_BPS = 500;

/**
 * Default royalty basis points (10%)
 */
export const DEFAULT_ROYALTY_BPS = 1000;

/**
 * Get USDC address for a given chain ID
 */
export const getUsdcAddress = (chainId: number): string => {
  switch (chainId) {
    case 8453:
      return BASE_USDC;
    case 84532:
      return BASE_SEPOLIA_USDC;
    default:
      throw new Error(`No USDC address configured for chain ID ${chainId}`);
  }
};

/**
 * Get block explorer URL for a given chain ID
 */
export const getExplorerUrl = (chainId: number): string => {
  switch (chainId) {
    case 8453:
      return "https://basescan.org";
    case 84532:
      return "https://sepolia.basescan.org";
    default:
      return "";
  }
};

/**
 * Format a transaction hash as an explorer link
 */
export const formatTxLink = (chainId: number, txHash: string): string => {
  const explorer = getExplorerUrl(chainId);
  if (!explorer) return txHash;
  return `${explorer}/tx/${txHash}`;
};

/**
 * Format an address as an explorer link
 */
export const formatAddressLink = (chainId: number, address: string): string => {
  const explorer = getExplorerUrl(chainId);
  if (!explorer) return address;
  return `${explorer}/address/${address}`;
};
