import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeploymentsExtension } from "hardhat-deploy/types";
import "@nomiclabs/hardhat-ethers";
import { ethers, BigNumber, Overrides } from "ethers";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import { ExchangeV2__factory } from "@rarible/exchange-v2/typechain-types";

const CHAINS_WITH_MANUAL_GAS = [137, 999]; // Polygon mainnet, HyperEVM
const GAS_PRICE_BUFFER_PCT = 10;
const MIN_PRIORITY_FEE_GWEI: Record<number, number> = {
  137: 30, // Polygon requires at least 25 gwei tip
};
const GAS_LIMIT_BY_CHAIN: Record<number, number> = {
  999: 300_000, // HyperEVM has a very low block gas limit
};

async function getGasOverrides(provider: ethers.providers.Provider, chainId: number): Promise<Overrides> {
  const overrides: Overrides = {};

  if (GAS_LIMIT_BY_CHAIN[chainId]) {
    overrides.gasLimit = GAS_LIMIT_BY_CHAIN[chainId];
    console.log(`  Gas override: gasLimit=${GAS_LIMIT_BY_CHAIN[chainId]}`);
  }

  if (!CHAINS_WITH_MANUAL_GAS.includes(chainId)) return overrides;

  const minPriority = MIN_PRIORITY_FEE_GWEI[chainId]
    ? ethers.utils.parseUnits(String(MIN_PRIORITY_FEE_GWEI[chainId]), "gwei")
    : BigNumber.from(0);

  try {
    const feeData = await provider.getFeeData();

    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      let maxPriority = feeData.maxPriorityFeePerGas.mul(100 + GAS_PRICE_BUFFER_PCT).div(100);
      if (maxPriority.lt(minPriority)) {
        maxPriority = minPriority;
      }
      let maxFee = feeData.maxFeePerGas.mul(100 + GAS_PRICE_BUFFER_PCT).div(100);
      if (maxFee.lt(maxPriority)) {
        maxFee = maxPriority.mul(2);
      }
      console.log(`  Gas override (EIP-1559): maxFeePerGas=${ethers.utils.formatUnits(maxFee, "gwei")} gwei, maxPriorityFeePerGas=${ethers.utils.formatUnits(maxPriority, "gwei")} gwei`);
      return { ...overrides, maxFeePerGas: maxFee, maxPriorityFeePerGas: maxPriority };
    }

    if (feeData.gasPrice) {
      let gasPrice = feeData.gasPrice.mul(100 + GAS_PRICE_BUFFER_PCT).div(100);
      if (gasPrice.lt(minPriority)) {
        gasPrice = minPriority;
      }
      console.log(`  Gas override (legacy): gasPrice=${ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);
      return { ...overrides, gasPrice };
    }
  } catch (err: any) {
    console.warn(`  ⚠️ Failed to fetch gas price, using defaults: ${err.message}`);
  }

  return overrides;
}

/**
 * Transfers ownership of all deployed contracts AND sets the protocol fee to zero
 * on the Exchange contract (ExchangeV2 or ExchangeMetaV2).
 *
 * The new owner is resolved automatically from the chain ID.
 *
 * Sample usage:
 *
 * npx hardhat transfer-ownership-and-zero-fees --network megaeth
 */

const NEW_OWNER_BY_CHAIN_ID: Record<number, string> = {
  4326:       "0x735092F168FaeDeeBA11eDAa765455ecFf3C53b7",  // MegaETH  - done
  8453:       "0x735092F168FaeDeeBA11eDAa765455ecFf3C53b7",  // Base - err
  1380012617: "0xf37867d72445332915083D76777daF3639Bde26E",  // RARI Chain - owner found
  137:        "0x735092F168FaeDeeBA11eDAa765455ecFf3C53b7",  // Polygon -- err
  33139:      "0xD39c38cc73dA45773D48f1cE330dF61769f0BAA6",  // Ape Chain -done
  5031:       "0x04a2684A46934504a62BdF9947AF166F01bf14F8",  // Somnia - done
  999:        "0x735092F168FaeDeeBA11eDAa765455ecFf3C53b7",  // HyperEVM - err
  7897:       "0x04a2684A46934504a62BdF9947AF166F01bf14F8",  // Arena-Z -  no funds
  1890:       "0x1943756057cBb3A858CC7cF4A25A7A35BdCa4eDb",  // LightLink - done
  1284:       "0x2dF7343e2bDeA99ecf9863915876bc841b8E76bB",  // Moonbeam - 0x256eFfCeA2ab308D31e318728D2615545171d85B   | Signer is not owner
  320:        "0x04a2684A46934504a62BdF9947AF166F01bf14F8",  // ZKcandy - done
  42793:      "0x2dF7343e2bDeA99ecf9863915876bc841b8E76bB",  // Etherlink - ExchangeMetaV2   | zero-fee  | FAILED   | 0x256eFfCeA2ab308D31e318728D2615545171d85B   | Signer is not owner
  32769:      "0x04a2684A46934504a62BdF9947AF166F01bf14F8",  // Zilliqa - err gas price rpc
  360:        "0x2dF7343e2bDeA99ecf9863915876bc841b8E76bB",  // Shape - no money on the account
  1776:       "0xeaD5aA8630e03C95c6D7c83c1FD1EA2C6749E4D7",  // Injective - done
  52014:      "0x04a2684A46934504a62BdF9947AF166F01bf14F8",  // Electroneum - done
  484:        "0xD39c38cc73dA45773D48f1cE330dF61769f0BAA6",  // Camp - done
  40:         "0x10B070b01284a1405faa3a633697547d3db2b38d",  // Telos - not the owner  - current owner 0x256eFfCeA2ab308D31e318728D2615545171d85B
  252:        "0x0e8b44Ac9675518Ec436a66c6654C9Df03b4c2f4",  // Fraxtal - done
  698:        "0x4471FC5378aAf93fE271f2402A087FBeB1c66532",  // Matchain - current owner 0x256eFfCeA2ab308D31e318728D2615545171d85B
  295:        "0x04a2684A46934504a62BdF9947AF166F01bf14F8",  // Hedera ???
  88888:      "0x6f23c7028ccd82b850291e33ea793dDfC885E3E3",  // Chiliz - current owner 0x256eFfCeA2ab308D31e318728D2615545171d85B
  2741:       "0xdD650Ffc2A089324e8d36B5a6Dd859c96A8564Df",  // Abstract - current owner 0x256eFfCeA2ab308D31e318728D2615545171d85B
  42161:      "0x735092F168FaeDeeBA11eDAa765455ecFf3C53b7",  // Arbitrum - current owner 0x256eFfCeA2ab308D31e318728D2615545171d85B
  80094:      "0x735092F168FaeDeeBA11eDAa765455ecFf3C53b7",  // BeraChain - current owner 0x256eFfCeA2ab308D31e318728D2615545171d85B
  42220:      "0x735092F168FaeDeeBA11eDAa765455ecFf3C53b7",  // Celo - current owner 0x256eFfCeA2ab308D31e318728D2615545171d85B
  143:        "0x735092F168FaeDeeBA11eDAa765455ecFf3C53b7",  // Monad - done
  5000:       "0x735092F168FaeDeeBA11eDAa765455ecFf3C53b7",  // Mantle  - current owner 0x20b9049c69DeA7e5d46De82cE0b33A9D5a8a0893 ??
  324:        "0x86ddc6cB0e94158AFD6DA3ae53a6Ec6182434AEB",  // Zksync - current owner 0x256eFfCeA2ab308D31e318728D2615545171d85B
  1329:       "0xA9F422E8A794b631Ab0B6d03f17c5eA288623bBC",  // Sei erro
  660279:     "0xD1dF6f70DAE06cfabCc02158D7beAEab75f8f8C6",  // Xai - current owner 0x256eFfCeA2ab308D31e318728D2615545171d85B
};

const EXCHANGE_CONTRACT_NAMES = ["ExchangeV2", "ExchangeMetaV2"];

type ResultStatus = "SUCCESS" | "SKIPPED" | "FAILED";
interface OperationResult {
  contract: string;
  operation: string;
  status: ResultStatus;
  owner: string;
  reason: string;
}

task(
  "transfer-ownership-and-zero-fees",
  "Transfers ownership of all deployed contracts and sets protocol fee to zero"
)
  .setAction(
    async (
      _args: {},
      hre: HardhatRuntimeEnvironment
    ) => {
      const { deployments, network } = hre as HardhatRuntimeEnvironment & {
        deployments: DeploymentsExtension;
      };
      const provider = hre.ethers.provider;
      const { HARDWARE_DERIVATION } = process.env;
      const { deployer } = await hre.getNamedAccounts();
      const signer = HARDWARE_DERIVATION
        ? new LedgerSigner(provider, "m/44'/60'/0'/0/0")
        : await hre.ethers.getSigner(deployer);
      const signerAddress = await signer.getAddress();

      const chainId = (await provider.getNetwork()).chainId;
      const newOwnerRaw = NEW_OWNER_BY_CHAIN_ID[chainId];
      if (!newOwnerRaw) {
        throw new Error(
          `No new owner configured for chain ID ${chainId} (network: ${network.name}). ` +
          `Add an entry to NEW_OWNER_BY_CHAIN_ID.`
        );
      }

      let newOwner: string;
      try {
        newOwner = ethers.utils.getAddress(newOwnerRaw);
      } catch {
        throw new Error(
          `Invalid new owner address for chain ID ${chainId}: "${newOwnerRaw}". Check the checksum.`
        );
      }

      console.log(`Using network: ${network.name} (chainId: ${chainId})`);
      console.log(`Using signer: ${signerAddress}`);
      console.log(`New owner: ${newOwner}`);

      const gasOverrides = await getGasOverrides(provider, chainId);

      const results: OperationResult[] = [];
      const allDeployments = await deployments.all();

      // --- Zero protocol fees on Exchange contract ---
      for (const [contractName] of Object.entries(allDeployments)) {
        if (!EXCHANGE_CONTRACT_NAMES.includes(contractName)) continue;

        console.log(`\n→ Zeroing protocol fee on ${contractName}...`);
        try {
          const deployment = await deployments.get(contractName);
          const exchange = ExchangeV2__factory.connect(deployment.address, signer);

          const currentOwner = await exchange.owner();
          console.log(`  Current owner: ${currentOwner}`);

          if (currentOwner.toLowerCase() === newOwner.toLowerCase()) {
            results.push({ contract: contractName, operation: "zero-fee", status: "SKIPPED", owner: currentOwner, reason: "Owner already transferred" });
            results.push({ contract: contractName, operation: "transfer-ownership", status: "SKIPPED", owner: currentOwner, reason: "Owner already transferred" });
            console.log(`  ⏩ Owner is already ${newOwner}, skipping fee + ownership.`);
            continue;
          }

          if (currentOwner.toLowerCase() !== signerAddress.toLowerCase()) {
            results.push({ contract: contractName, operation: "zero-fee", status: "FAILED", owner: currentOwner, reason: "Signer is not owner" });
            results.push({ contract: contractName, operation: "transfer-ownership", status: "FAILED", owner: currentOwner, reason: "Signer is not owner" });
            console.log(`  ❌ Signer is not the owner, cannot zero fees or transfer.`);
            continue;
          }

          const currentFee = await exchange.protocolFee();
          console.log(
            `  Current fee — receiver: ${currentFee.receiver}, buyer: ${currentFee.buyerAmount}, seller: ${currentFee.sellerAmount}`
          );

          if (currentFee.buyerAmount == 0 && currentFee.sellerAmount == 0) {
            console.log(`  ⏩ Fees already zero.`);
            results.push({ contract: contractName, operation: "zero-fee", status: "SKIPPED", owner: currentOwner, reason: "Fees already zero" });
          } else {
            const tx = await exchange.setAllProtocolFeeData(currentFee.receiver, 0, 0, gasOverrides);
            console.log(`  Tx hash: ${tx.hash}`);
            await tx.wait();
            console.log(`  ✅ Protocol fee set to zero.`);
            results.push({ contract: contractName, operation: "zero-fee", status: "SUCCESS", owner: currentOwner, reason: `tx: ${tx.hash}` });
          }

          console.log(`\n→ Transferring ownership of ${contractName}...`);
          const txOwner = await exchange.transferOwnership(newOwner, gasOverrides);
          console.log(`  Tx hash: ${txOwner.hash}`);
          await txOwner.wait();
          console.log(`  ✅ Ownership transferred.`);
          results.push({ contract: contractName, operation: "transfer-ownership", status: "SUCCESS", owner: currentOwner, reason: `tx: ${txOwner.hash}` });
        } catch (err: any) {
          const reason = err.reason || err.message || String(err);
          console.error(`  ❌ Failed: ${reason}`);
          if (!results.some(r => r.contract === contractName && r.operation === "zero-fee")) {
            results.push({ contract: contractName, operation: "zero-fee", status: "FAILED", owner: "unknown", reason });
          }
          if (!results.some(r => r.contract === contractName && r.operation === "transfer-ownership")) {
            results.push({ contract: contractName, operation: "transfer-ownership", status: "FAILED", owner: "unknown", reason });
          }
        }
      }

      // --- Transfer ownership of all contracts ---
      for (const [contractName, deployment] of Object.entries(allDeployments)) {
        if (contractName.endsWith("_Implementation") || contractName.endsWith("_Proxy")) {
          results.push({ contract: contractName, operation: "transfer-ownership", status: "SKIPPED", owner: "-", reason: "Implementation/Proxy entry" });
          continue;
        }

        // Skip if already recorded (Exchange contracts handled above)
        if (
          EXCHANGE_CONTRACT_NAMES.includes(contractName) &&
          results.some(r => r.contract === contractName && r.operation === "transfer-ownership")
        ) {
          continue;
        }

        console.log(`\n→ Processing: ${contractName} at ${deployment.address}`);
        try {
          const contract = await hre.ethers.getContractAt(
            deployment.abi,
            deployment.address,
            signer
          );

          let currentOwner: string;
          try {
            currentOwner = await contract.owner();
          } catch {
            results.push({ contract: contractName, operation: "transfer-ownership", status: "SKIPPED", owner: "-", reason: "Not Ownable (no owner())" });
            console.log(`  ⏩ Skipped: not Ownable.`);
            continue;
          }

          console.log(`  Current owner: ${currentOwner}`);

          if (currentOwner.toLowerCase() === newOwner.toLowerCase()) {
            results.push({ contract: contractName, operation: "transfer-ownership", status: "SKIPPED", owner: currentOwner, reason: "Already owned by target" });
            console.log(`  ⏩ Already owned by target.`);
            continue;
          }

          if (currentOwner.toLowerCase() !== signerAddress.toLowerCase()) {
            results.push({ contract: contractName, operation: "transfer-ownership", status: "FAILED", owner: currentOwner, reason: "Signer is not owner" });
            console.log(`  ❌ Signer is not the owner.`);
            continue;
          }

          const tx = await contract.transferOwnership(newOwner, gasOverrides);
          console.log(`  Tx hash: ${tx.hash}`);
          await tx.wait();
          console.log(`  ✅ Ownership transferred.`);
          results.push({ contract: contractName, operation: "transfer-ownership", status: "SUCCESS", owner: currentOwner, reason: `tx: ${tx.hash}` });
        } catch (err: any) {
          const reason = err.reason || err.message || String(err);
          console.error(`  ❌ Failed: ${reason}`);
          results.push({ contract: contractName, operation: "transfer-ownership", status: "FAILED", owner: "unknown", reason });
        }
      }

      // --- Print summary ---
      console.log(`\n${"=".repeat(120)}`);
      console.log(`SUMMARY — ${network.name} (chainId: ${chainId})`);
      console.log(`${"=".repeat(120)}`);
      console.log(
        `${"Contract".padEnd(40)} | ${"Operation".padEnd(20)} | ${"Status".padEnd(8)} | ${"Current Owner".padEnd(44)} | Reason`
      );
      console.log(`${"-".repeat(40)}-+-${"-".repeat(20)}-+-${"-".repeat(8)}-+-${"-".repeat(44)}-+-${"-".repeat(40)}`);
      for (const r of results) {
        console.log(
          `${r.contract.padEnd(40)} | ${r.operation.padEnd(20)} | ${r.status.padEnd(8)} | ${r.owner.padEnd(44)} | ${r.reason}`
        );
      }
      console.log(`${"=".repeat(120)}`);

      const succeeded = results.filter(r => r.status === "SUCCESS").length;
      const skipped = results.filter(r => r.status === "SKIPPED").length;
      const failed = results.filter(r => r.status === "FAILED").length;
      console.log(`\nTotal: ${results.length}  |  ✅ ${succeeded} succeeded  |  ⏩ ${skipped} skipped  |  ❌ ${failed} failed`);
    }
  );

export default {};
