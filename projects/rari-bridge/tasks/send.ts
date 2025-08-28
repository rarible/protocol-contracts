// <ai_context>
// Hardhat task to bridge tokens via LayerZero V2 OFT/OFTAdapter using TypeChain.
// - Builds Options bytes equivalent to OptionsBuilder.newOptions().addExecutorLzReceiveOption(gas, 0).
// - Detects decimals automatically (RariOFT.decimals() or ERC20.decimals() via OFTAdapter.token()).
// - Quotes fees with quoteSend and calls send(), paying native fee by default.
// - Optional --approve for adapters to approve underlying ERC20 before send.
// Reference: LayerZero V2 OFT Quickstart.
// </ai_context>

import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getLedgerSigner } from "@rarible/deploy-utils";
import { ethers } from "ethers";
import { getEndpointV2IdByChainId } from "../utils";

// Minimal ERC20 interface for decimals/approve (TypeChain may not include external OZ interfaces)
const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

function hexU16(n: ethers.BigNumberish) {
  return ethers.utils.hexZeroPad(ethers.utils.hexlify(n), 2); // 2 bytes
}
function hexU128(n: ethers.BigNumberish) {
  return ethers.utils.hexZeroPad(ethers.utils.hexlify(n), 16); // 16 bytes
}

/**
 * Build LayerZero V2 Options bytes for: Executor -> lzReceive option (gas, value=0).
 * Encodes the same as: OptionsBuilder.newOptions().addExecutorLzReceiveOption(gas, 0)
 *
 * Structure (concatenated):
 *  - uint16  : 0x0003           // options type marker (type 3)
 *  - uint8   : 0x01             // worker id = Executor
 *  - uint16  : length           // option length = 1 (optionType) + payload bytes
 *  - uint8   : 0x01             // optionType = lzReceive
 *  - bytes   : payload (uint128 gas)  (value=0 omitted)
 */
function buildLzReceiveOptions(gas: ethers.BigNumberish): string {
  const headerType3 = ethers.utils.hexZeroPad(ethers.utils.hexlify(0x0003), 2); // uint16
  const workerExecutor = ethers.utils.hexZeroPad(ethers.utils.hexlify(0x01), 1); // uint8
  const optionTypeLzReceive = ethers.utils.hexZeroPad(ethers.utils.hexlify(0x01), 1); // uint8
  const payload = hexU128(gas); // only gas, value=0
  const len = hexU16(1 + ethers.utils.arrayify(payload).length); // optionType + payload
  return ethers.utils.hexConcat([headerType3, workerExecutor, len, optionTypeLzReceive, payload]);
}

task("oft:send", "Bridge tokens via LayerZero V2 OFT/OFTAdapter")
  .addParam("source", "OFT/OFTAdapter contract address (on source chain)")
  .addParam("targetChainId", "Destination Endpoint ID (uint32)")
  .addParam("to", "Recipient EVM address on destination chain")
  .addParam("amount", "Amount in whole tokens (e.g., 10.5)")
  .addOptionalParam("decimals", "Token decimals override (auto-detected if omitted)", "")
  .addOptionalParam("gas", "lzReceive gas on destination (default 200000)", "200000")
  .addOptionalParam("payInLz", "Pay fee in LZ token instead of native (default false)", "false")
  .setAction(async (args, hre: HardhatRuntimeEnvironment) => {
    const { RariOFT, RariOFTAdapter } = await import("../typechain-types");
    const { RariOFT__factory, RariOFTAdapter__factory } = await import("../typechain-types");

    const { ethers: hreEthers, network } = hre;
    const signer = getLedgerSigner(hreEthers.provider, "m/44'/60'/0'/0/0");
    const sender = await signer.getAddress();

    // Connect as canonical OFT; if that fails, fall back to Adapter
    let oft: RariOFT | RariOFTAdapter;
    let isAdapter = false;
    try {
      const c = RariOFT__factory.connect(args.source, signer);
      await c.name(); // probe
      oft = c;
    } catch {
      const a = RariOFTAdapter__factory.connect(args.source, signer);
      await a.owner(); // probe
      oft = a;
    }

    if(network.name === "sepolia" || network.name === "mainnet") {
      isAdapter = true;
      const a = RariOFTAdapter__factory.connect(args.source, signer);
      await a.owner(); // probe
      oft = a;
    }

    // Determine decimals
    let decimals: number;
    if (args.decimals) {
      decimals = Number(args.decimals);
    } else {
      if (isAdapter) {
        const tokenAddr = await (oft as RariOFTAdapter).token();
        const erc20 = new hreEthers.Contract(tokenAddr, ERC20_ABI, signer);
        decimals = await erc20.decimals();
      } else {
        decimals = await (oft as RariOFT).decimals();
      }
    }

    const amountLD = hreEthers.utils.parseUnits(args.amount, decimals);
    const minAmountLD = amountLD; // simple case: no slippage; adjust if you need
    const dstEid = getEndpointV2IdByChainId(Number(args.targetChainId));
    const toBytes32 = hreEthers.utils.hexZeroPad(args.to, 32);
    const gas = hreEthers.BigNumber.from(args.gas);
    const payInLzToken = String(args.payInLz).toLowerCase() === "true";

    // Build options = OptionsBuilder.newOptions().addExecutorLzReceiveOption(gas, 0)
    const extraOptions = buildLzReceiveOptions(gas);

    // Optional approval for adapters
    if (isAdapter) {
      const tokenAddr = await (oft as RariOFTAdapter).token();
      const erc20 = new hreEthers.Contract(tokenAddr, ERC20_ABI, signer);
      console.log(`[${network.name}] Approving ${args.source} to spend ${amountLD.toString()} of ${tokenAddr} ...`);
      const txA = await erc20.approve(args.source, amountLD);
      console.log("approve.tx:", txA.hash);
      await txA.wait();
      console.log("✅ Approved.");
    }

    const sendParam = {
      dstEid,
      to: toBytes32,
      amountLD,
      minAmountLD,
      extraOptions,
      composeMsg: "0x",
      oftCmd: "0x",
    };

    // Quote fee
    const fee = await oft.quoteSend(sendParam, payInLzToken);
    console.log("Quoted fee:", {
      nativeFee: fee.nativeFee?.toString?.() ?? String(fee.nativeFee),
      lzTokenFee: fee.lzTokenFee?.toString?.() ?? String(fee.lzTokenFee),
    });

    // Send
    console.log(`[${network.name}] Sending ${args.amount} (decimals=${decimals}) to ${args.to} (eid=${dstEid}) ...`);
    const tx = await oft.send(sendParam, fee, sender, {
      value: payInLzToken ? 0 : fee.nativeFee,
    });
    console.log("send.tx:", tx.hash);
    await tx.wait();
    console.log("✅ Sent.");
  });