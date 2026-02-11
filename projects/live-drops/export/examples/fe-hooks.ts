/**
 * EXAMPLE: React hooks for LiveDrops on FE (wagmi + viem)
 * Adapt to your existing hook patterns and BFF client (hc).
 */
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useAccount,
} from "wagmi";
import { parseEther, parseUnits, type Address } from "viem";
import {
  liveDropFactoryAbi,
  liveDropCollectionAbi,
  erc20Abi,
  liveDropFactoryAddress,
  usdcAddress,
  USDC_DECIMALS,
  type CreateDropParams,
  type MintCurrency,
} from "@your-org/live-drops"; // <- shared package

const CHAIN_ID = 8453; // Base

// =========================================================================
//  CREATE DROP (Streamer)
// =========================================================================

/**
 * Hook for streamer to create a new LiveDrop collection.
 *
 * Flow:
 *  1. Call writeContract with factory.createCollection(config)
 *  2. Wait for receipt
 *  3. Extract CollectionCreated event → collectionAddress
 *  4. Report to BFF via API
 */
export const useCreateDrop = () => {
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleCreateDrop = (params: CreateDropParams) => {
    writeContract({
      address: liveDropFactoryAddress[CHAIN_ID],
      abi: liveDropFactoryAbi,
      functionName: "createCollection",
      args: [
        {
          name: params.name,
          symbol: params.symbol,
          description: params.description,
          icon: params.icon,
          tokenMetaName: params.tokenMetaName,
          tokenMetaDescription: params.tokenMetaDescription,
          tokenMetaImage: params.tokenMetaImage,
        },
      ],
    });
  };

  return {
    handleCreateDrop,
    txHash,
    isPending,
    isConfirming,
    isSuccess,
  };
};

// =========================================================================
//  MINT NATIVE (Viewer)
// =========================================================================

/**
 * Hook for viewer to mint with native ETH.
 *
 * Flow:
 *  1. Call mintNative(to, amount) with value = amount
 *  2. Wait for receipt
 *  3. Report to BFF
 */
export const useMintNative = (collectionAddress: Address) => {
  const { address: viewer } = useAccount();
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleMintNative = (amountEth: string) => {
    if (!viewer) return;
    const value = parseEther(amountEth);

    writeContract({
      address: collectionAddress,
      abi: liveDropCollectionAbi,
      functionName: "mintNative",
      args: [viewer, value],
      value,
    });
  };

  return { handleMintNative, txHash, isPending, isConfirming, isSuccess };
};

// =========================================================================
//  MINT ERC-20 / USDC (Viewer)
// =========================================================================

/**
 * Hook for viewer to mint with USDC.
 *
 * Flow:
 *  1. Check allowance
 *  2. If insufficient → approve(collection, amount)
 *  3. Call mintErc20(to, amount)
 *  4. Wait for receipt
 *  5. Report to BFF
 */
export const useMintErc20 = (collectionAddress: Address) => {
  const { address: viewer } = useAccount();

  // Step 1: Read current allowance
  const { data: allowance } = useReadContract({
    address: usdcAddress[CHAIN_ID],
    abi: erc20Abi,
    functionName: "allowance",
    args: viewer ? [viewer, collectionAddress] : undefined,
  });

  // Step 2: Approve USDC
  const {
    writeContract: writeApprove,
    data: approveTxHash,
    isPending: isApproving,
  } = useWriteContract();
  const { isSuccess: isApproved } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });

  // Step 3: Mint
  const {
    writeContract: writeMint,
    data: mintTxHash,
    isPending: isMinting,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isMinted } =
    useWaitForTransactionReceipt({ hash: mintTxHash });

  const handleMintErc20 = (amountUsdc: string) => {
    if (!viewer) return;
    const amount = parseUnits(amountUsdc, USDC_DECIMALS);

    // Check if approval needed
    if (!allowance || allowance < amount) {
      writeApprove({
        address: usdcAddress[CHAIN_ID],
        abi: erc20Abi,
        functionName: "approve",
        args: [collectionAddress, amount],
      });
      // After approval, user needs to call handleMintErc20 again
      // or use useEffect to auto-trigger mint after approval
      return;
    }

    writeMint({
      address: collectionAddress,
      abi: liveDropCollectionAbi,
      functionName: "mintErc20",
      args: [viewer, amount],
    });
  };

  return {
    handleMintErc20,
    allowance,
    isApproving,
    isApproved,
    isMinting,
    isConfirming,
    isMinted,
    approveTxHash,
    mintTxHash,
  };
};

// =========================================================================
//  PAUSE / UNPAUSE (Streamer)
// =========================================================================

export const usePauseDrop = (collectionAddress: Address) => {
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const handlePause = () => {
    writeContract({
      address: collectionAddress,
      abi: liveDropCollectionAbi,
      functionName: "pause",
    });
  };

  const handleUnpause = () => {
    writeContract({
      address: collectionAddress,
      abi: liveDropCollectionAbi,
      functionName: "unpause",
    });
  };

  return { handlePause, handleUnpause, txHash, isPending, isSuccess };
};

// =========================================================================
//  READ: Collection state (for UI display)
// =========================================================================

export const useDropState = (collectionAddress: Address | undefined) => {
  const { data: paused } = useReadContract({
    address: collectionAddress,
    abi: liveDropCollectionAbi,
    functionName: "paused",
    query: { enabled: !!collectionAddress },
  });

  const { data: totalSupply } = useReadContract({
    address: collectionAddress,
    abi: liveDropCollectionAbi,
    functionName: "totalSupply",
    query: { enabled: !!collectionAddress },
  });

  const { data: name } = useReadContract({
    address: collectionAddress,
    abi: liveDropCollectionAbi,
    functionName: "name",
    query: { enabled: !!collectionAddress },
  });

  return { paused, totalSupply, name };
};
