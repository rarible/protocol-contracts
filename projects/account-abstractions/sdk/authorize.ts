// Import required dependencies from viem
import { PrivateKeyAccount, createWalletClient, http } from "viem";
import { privateKeyToAccount } from 'viem/accounts'
import { Chain, hoodi } from 'viem/chains'

// Load environment variables from .env file
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env";
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });

// Access private key and contract address from .env
const privateKey = process.env.PRIVATE_KEY! as any;
const contractAddress = process.env.CONTRACT_ADDRESS as any;

// Ensure environment variables are defined
if (!privateKey || !contractAddress) {
  throw new Error("Missing PRIVATE_KEY or CONTRACT_ADDRESS in .env file");
}

// Initialize account from private key
const eoa = privateKeyToAccount(privateKey);

// Create EOA client
const eoaClient = createWalletClient({
  account: eoa,
  chain: hoodi,
  transport: http(),
});

// Create wallet client
const walletClient = createWalletClient({
  account: eoa, // Using the same account as eoa
  chain: hoodi, // Assumes chain is imported and defined
  transport: http(),
});

// Sign authorization
const authorization = await eoaClient.signAuthorization({
  account: walletClient.account.address,
  contractAddress,
  // Use `executor: "self"` if walletClient's account is sending the transaction
  // executor: "self",
});

// Send the `authorization` along with `data`
const receipt = await walletClient
  .sendTransaction({
    authorizationList: [authorization],
    data: '0x<CALLDATA_TO_EXECUTE_IN_THE_ACCOUNT>',
    to: eoa.address,
  })
  .then((txHash) =>
    publicClient.waitForTransactionReceipt({
      hash: txHash,
    })
  );

// Print receipt
console.log(userOpReceipt);