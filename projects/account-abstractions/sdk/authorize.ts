// Import required dependencies from viem
import { PrivateKeyAccount, createWalletClient, encodeFunctionData, http, parseEther } from "viem";
import { privateKeyToAccount } from 'viem/accounts'
import { Chain, hoodi } from 'viem/chains'
import {RaribleAccountERC7702__factory} from "../typechain-types";

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


// Define the operations
const operations: (string | bigint)[][] = [
  ['0xcb98643b8786950F0461f3B0edf99D88F274574D', parseEther('0.001'), '0x'],
  ['0xd2135CfB216b74109775236E36d4b433F1DF507B', parseEther('0.002'), '0x'],
];

// Encode the operations into a hex string
const encodedData = encodeFunctionData({
  abi: RaribleAccountERC7702__factory.abi,
  functionName: 'execute',
  args: [operations],
}) as `0x${string}`;

const hash = await walletClient.sendTransaction({
  authorizationList: [authorization],
  data: encodeFunctionData({
    abi: RaribleAccountERC7702__factory.abi,
    functionName: 'execute',
    args: [
        ['0xcb98643b8786950F0461f3B0edf99D88F274574D', parseEther('0.001') as any, '0x' as any],
        ['0xd2135CfB216b74109775236E36d4b433F1DF507B', parseEther('0.002') as any, '0x' as any],
      
    ],
  }),
  to: walletClient.account.address,
});
// Print receipt
console.log(userOpReceipt);