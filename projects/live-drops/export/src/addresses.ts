/**
 * LiveDropFactory deployed addresses per chain
 */
export const liveDropFactoryAddress = {
  [8453]: "0xb408c5d25F28d6239E30b80E2c14Fd64b028702A", // Base Mainnet
} as const;

/**
 * USDC token addresses per chain
 */
export const usdcAddress = {
  [8453]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base Mainnet
  [84532]: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia
} as const;

export type SupportedChainId = keyof typeof liveDropFactoryAddress;
