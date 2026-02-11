import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { FactoryClient, CollectionClient } from "../sdk";
import { BASE_USDC } from "../utils";

const FACTORY = "0xb408c5d25F28d6239E30b80E2c14Fd64b028702A";

// ERC20 minimal ABI for approval + balance check
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

let passed = 0;
let failed = 0;
let skipped = 0;

const ok = (name: string, detail?: string) => {
  passed++;
  console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ""}`);
};

const fail = (name: string, err: any) => {
  failed++;
  const msg = err?.reason || err?.message || String(err);
  console.log(`  ❌ ${name} — ${msg.substring(0, 120)}`);
};

const skip = (name: string, reason: string) => {
  skipped++;
  console.log(`  ⏭️  ${name} — SKIPPED: ${reason}`);
};

const expectRevert = async (name: string, fn: () => Promise<any>) => {
  try {
    await fn();
    fail(name, "Expected revert but tx succeeded!");
  } catch (err: any) {
    const msg = err?.reason || err?.error?.reason || err?.message || "";
    if (
      msg.includes("revert") ||
      msg.includes("Unauthorized") ||
      msg.includes("OnlyFactory") ||
      msg.includes("execution reverted") ||
      msg.includes("CALL_EXCEPTION") ||
      msg.includes("EnforcedPause")
    ) {
      ok(name, `reverted as expected`);
    } else {
      fail(name, err);
    }
  }
};

async function main() {
  const signers = await ethers.getSigners();
  const factoryOwner = signers[0]; // 0xfb571F...
  const creator = signers[1]; // 0x6F918E...
  const minter = signers[2]; // 0x330675...
  const chainId = (await ethers.provider.getNetwork()).chainId;

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║          LIVE DROPS — PRODUCTION TEST SUITE             ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  console.log(`  Factory:       ${FACTORY}`);
  console.log(`  Chain:         ${chainId} (Base)`);
  console.log(`  Factory Owner: ${factoryOwner.address}`);
  console.log(`  Creator:       ${creator.address}`);
  console.log(`  Minter:        ${minter.address}\n`);

  // Check balances
  const foBalance = await factoryOwner.getBalance();
  const crBalance = await creator.getBalance();
  const mtBalance = await minter.getBalance();
  console.log(`  Balances (ETH):`);
  console.log(`    Factory Owner: ${ethers.utils.formatEther(foBalance)}`);
  console.log(`    Creator:       ${ethers.utils.formatEther(crBalance)}`);
  console.log(`    Minter:        ${ethers.utils.formatEther(mtBalance)}`);

  // Check USDC balance for minter
  const usdc = new ethers.Contract(BASE_USDC, ERC20_ABI, minter);
  const usdcDecimals = await usdc.decimals();
  const usdcBalance: BigNumber = await usdc.balanceOf(minter.address);
  const usdcFormatted = ethers.utils.formatUnits(usdcBalance, usdcDecimals);
  console.log(`    Minter USDC:   ${usdcFormatted}\n`);

  // =====================================================================
  // PHASE 1: Creator creates a new collection
  // =====================================================================
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  PHASE 1: Collection Creator creates a collection");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  let collectionAddress: string;
  const factoryAsCreator = FactoryClient.connect(FACTORY, creator);

  try {
    const result = await factoryAsCreator.createCollection({
      name: "Prod Test Drop",
      symbol: "PTD",
      description: "Production test collection",
      icon: "https://rarible.com/test-icon.png",
      tokenMetaName: "Test Stream Token",
      tokenMetaDescription: "A token from production testing",
      tokenMetaImage: "https://rarible.com/test-token.png",
    });
    collectionAddress = result.collectionAddress;
    ok("Create collection", `address: ${collectionAddress}`);
  } catch (err: any) {
    fail("Create collection", err);
    console.log("\n⛔ Cannot continue without collection. Exiting.\n");
    return;
  }

  // Verify collection is registered
  try {
    const isCol = await factoryAsCreator.isCollection(collectionAddress);
    if (isCol) ok("isCollection returns true");
    else fail("isCollection", "returned false");
  } catch (err) {
    fail("isCollection", err);
  }

  // Collection count
  try {
    const count = await factoryAsCreator.getCollectionCount();
    ok("getCollectionCount", `${count} collections`);
  } catch (err) {
    fail("getCollectionCount", err);
  }

  // =====================================================================
  // PHASE 2: Read-only views
  // =====================================================================
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  PHASE 2: Read-only views");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const colAsCreator = CollectionClient.connect(collectionAddress, creator);

  try {
    const state = await colAsCreator.getState();
    ok("getState (inspect)", `owner=${state.owner}, feeBps=${state.feeBps}, paused=${state.paused}`);

    if (state.owner.toLowerCase() === creator.address.toLowerCase()) {
      ok("Owner is creator");
    } else {
      fail("Owner check", `Expected ${creator.address}, got ${state.owner}`);
    }

    if (state.factory.toLowerCase() === FACTORY.toLowerCase()) {
      ok("Factory address correct");
    } else {
      fail("Factory address", `Expected ${FACTORY}, got ${state.factory}`);
    }
  } catch (err) {
    fail("getState", err);
  }

  try {
    const contractURI = await colAsCreator.contractURI();
    if (contractURI.startsWith("data:application/json;base64,")) {
      const json = Buffer.from(contractURI.split(",")[1], "base64").toString();
      ok("contractURI", json.substring(0, 80));
    } else {
      fail("contractURI", "Invalid format");
    }
  } catch (err) {
    fail("contractURI", err);
  }

  try {
    const supply = await colAsCreator.totalSupply();
    ok("totalSupply", `${supply.toString()} tokens`);
  } catch (err) {
    fail("totalSupply", err);
  }

  // =====================================================================
  // PHASE 3: Minter mints with native ETH
  // =====================================================================
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  PHASE 3: Minter mints with native ETH");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const colAsMinter = CollectionClient.connect(collectionAddress, minter);
  let mintedTokenId: BigNumber | null = null;

  try {
    const mintAmount = ethers.utils.parseEther("0.000000000000001"); // 1000 wei
    const result = await colAsMinter.mintNative(minter.address, mintAmount);
    mintedTokenId = result.tokenId;
    ok("mintNative", `tokenId=${result.tokenId}, fee=${result.fee}`);
  } catch (err) {
    fail("mintNative", err);
  }

  // Verify tokenURI
  if (mintedTokenId !== null) {
    try {
      const uri = await colAsMinter.tokenURI(mintedTokenId);
      const json = Buffer.from(uri.split(",")[1], "base64").toString();
      ok("tokenURI", json.substring(0, 80));
    } catch (err) {
      fail("tokenURI", err);
    }

    // Verify ownerOf
    try {
      const tokenOwner = await colAsMinter.ownerOf(mintedTokenId);
      if (tokenOwner.toLowerCase() === minter.address.toLowerCase()) {
        ok("ownerOf", `Token #${mintedTokenId} owned by minter`);
      } else {
        fail("ownerOf", `Expected ${minter.address}, got ${tokenOwner}`);
      }
    } catch (err) {
      fail("ownerOf", err);
    }
  }

  // Check totalSupply after mint
  try {
    const supply = await colAsMinter.totalSupply();
    ok("totalSupply after mint", `${supply.toString()}`);
  } catch (err) {
    fail("totalSupply after mint", err);
  }

  // =====================================================================
  // PHASE 4: Minter mints with ERC-20 (USDC)
  // =====================================================================
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  PHASE 4: Minter mints with ERC-20 (USDC)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  let erc20TokenId: BigNumber | null = null;

  if (usdcBalance.gt(0)) {
    // Approve USDC for collection
    const mintAmountUsdc = ethers.utils.parseUnits("1", usdcDecimals); // 1 USDC
    const actualAmount = usdcBalance.lt(mintAmountUsdc) ? usdcBalance : mintAmountUsdc;

    try {
      const approveTx = await usdc.approve(collectionAddress, actualAmount);
      await approveTx.wait();
      ok("USDC approve", `${ethers.utils.formatUnits(actualAmount, usdcDecimals)} USDC`);
    } catch (err) {
      fail("USDC approve", err);
    }

    try {
      const result = await colAsMinter.mintErc20(minter.address, actualAmount);
      erc20TokenId = result.tokenId;
      ok("mintErc20 (USDC)", `tokenId=${result.tokenId}, fee=${result.fee}`);
    } catch (err) {
      fail("mintErc20 (USDC)", err);
    }
  } else {
    skip("mintErc20 (USDC)", "Minter has 0 USDC");
  }

  // =====================================================================
  // PHASE 5: Collection Creator admin operations
  // =====================================================================
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  PHASE 5: Collection Creator (owner) admin operations");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Set fees
  try {
    await colAsCreator.setFees(700, 0, 0); // 7%
    ok("Creator setFees", "7% (700 bps)");
  } catch (err) {
    fail("Creator setFees", err);
  }

  // Set royalty
  try {
    await colAsCreator.setRoyalty(creator.address, 500); // 5%
    ok("Creator setRoyalty", "5% to creator");
  } catch (err) {
    fail("Creator setRoyalty", err);
  }

  // Set collection metadata
  try {
    await colAsCreator.setCollectionMetadata(
      "Updated by creator",
      "https://rarible.com/updated-icon.png"
    );
    ok("Creator setCollectionMetadata");
  } catch (err) {
    fail("Creator setCollectionMetadata", err);
  }

  // Set token metadata
  try {
    await colAsCreator.setTokenMetadata(
      "Updated Token Name",
      "Updated by creator",
      "https://rarible.com/updated-token.png"
    );
    ok("Creator setTokenMetadata");
  } catch (err) {
    fail("Creator setTokenMetadata", err);
  }

  // Set ERC-20 token (set back to USDC to prove it works)
  try {
    await colAsCreator.setErc20Token(BASE_USDC);
    ok("Creator setErc20Token", BASE_USDC);
  } catch (err) {
    fail("Creator setErc20Token", err);
  }

  // Creator CANNOT setFeeRecipient (factory owner only)
  await expectRevert("Creator setFeeRecipient (should revert)", async () => {
    await colAsCreator.setFeeRecipient(creator.address);
  });

  // =====================================================================
  // PHASE 6: Factory Owner overrides on Creator's collection
  // =====================================================================
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  PHASE 6: Factory Owner overrides Creator's collection");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const colAsFactory = CollectionClient.connect(collectionAddress, factoryOwner);

  // Factory owner sets fees
  try {
    await colAsFactory.setFees(500, 0, 0); // back to 5%
    ok("Factory setFees on creator's collection", "5%");
  } catch (err) {
    fail("Factory setFees", err);
  }

  // Factory owner sets fee recipient
  try {
    await colAsFactory.setFeeRecipient(factoryOwner.address);
    ok("Factory setFeeRecipient", factoryOwner.address);
  } catch (err) {
    fail("Factory setFeeRecipient", err);
  }

  // Factory owner sets royalty
  try {
    await colAsFactory.setRoyalty(creator.address, 1000); // back to 10%
    ok("Factory setRoyalty", "10% to creator");
  } catch (err) {
    fail("Factory setRoyalty", err);
  }

  // Factory owner sets collection metadata
  try {
    await colAsFactory.setCollectionMetadata(
      "Overridden by factory owner",
      "https://rarible.com/factory-icon.png"
    );
    ok("Factory setCollectionMetadata");
  } catch (err) {
    fail("Factory setCollectionMetadata", err);
  }

  // Factory owner sets token metadata
  try {
    await colAsFactory.setTokenMetadata(
      "Factory Token",
      "Overridden by factory owner",
      "https://rarible.com/factory-token.png"
    );
    ok("Factory setTokenMetadata");
  } catch (err) {
    fail("Factory setTokenMetadata", err);
  }

  // =====================================================================
  // PHASE 7: Pause / Unpause
  // =====================================================================
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  PHASE 7: Pause / Unpause");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Creator pauses
  try {
    await colAsCreator.pause();
    ok("Creator pause");
  } catch (err) {
    fail("Creator pause", err);
  }

  // Minter tries to mint while paused
  await expectRevert("Mint while paused (should revert)", async () => {
    const mintAmount = ethers.utils.parseEther("0.000000000000001");
    await colAsMinter.mintNative(minter.address, mintAmount);
  });

  // Creator unpauses
  try {
    await colAsCreator.unpause();
    ok("Creator unpause");
  } catch (err) {
    fail("Creator unpause", err);
  }

  // Factory owner pauses
  try {
    await colAsFactory.pause();
    ok("Factory pause");
  } catch (err) {
    fail("Factory pause", err);
  }

  // Factory owner unpauses
  try {
    await colAsFactory.unpause();
    ok("Factory unpause");
  } catch (err) {
    fail("Factory unpause", err);
  }

  // =====================================================================
  // PHASE 8: Access control — Minter (unauthorized) tries admin ops
  // =====================================================================
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  PHASE 8: Access control — Minter tries admin ops");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  await expectRevert("Minter setFees (should revert)", async () => {
    await colAsMinter.setFees(100, 0, 0);
  });

  await expectRevert("Minter setRoyalty (should revert)", async () => {
    await colAsMinter.setRoyalty(minter.address, 500);
  });

  await expectRevert("Minter setCollectionMetadata (should revert)", async () => {
    await colAsMinter.setCollectionMetadata("hacked", "hacked");
  });

  await expectRevert("Minter setTokenMetadata (should revert)", async () => {
    await colAsMinter.setTokenMetadata("hacked", "hacked", "hacked");
  });

  await expectRevert("Minter setErc20Token (should revert)", async () => {
    await colAsMinter.setErc20Token(minter.address);
  });

  await expectRevert("Minter setFeeRecipient (should revert)", async () => {
    await colAsMinter.setFeeRecipient(minter.address);
  });

  await expectRevert("Minter pause (should revert)", async () => {
    await colAsMinter.pause();
  });

  // =====================================================================
  // PHASE 9: Mint after fee change, then Burn
  // =====================================================================
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  PHASE 9: Mint after fee change + Burn");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  let burnTokenId: BigNumber | null = null;

  // Mint again (fees now 5% set by factory owner)
  try {
    const mintAmount = ethers.utils.parseEther("0.000000000000002"); // 2000 wei
    const result = await colAsMinter.mintNative(minter.address, mintAmount);
    burnTokenId = result.tokenId;
    ok("mintNative after fee change", `tokenId=${result.tokenId}, fee=${result.fee} (5% of 2000 = 100)`);
  } catch (err) {
    fail("mintNative after fee change", err);
  }

  // Total supply before burn
  let supplyBeforeBurn: BigNumber | null = null;
  try {
    supplyBeforeBurn = await colAsMinter.totalSupply();
    ok("totalSupply before burn", supplyBeforeBurn.toString());
  } catch (err) {
    fail("totalSupply before burn", err);
  }

  // Burn the token
  if (burnTokenId !== null) {
    try {
      await colAsMinter.burn(burnTokenId);
      ok("burn", `Token #${burnTokenId} burned by minter`);
    } catch (err) {
      fail("burn", err);
    }

    // Verify ownerOf reverts after burn
    await expectRevert("ownerOf after burn (should revert)", async () => {
      await colAsMinter.ownerOf(burnTokenId!);
    });
  }

  // Total supply after burn (should still be same — totalSupply = _totalMinted)
  try {
    const supplyAfterBurn = await colAsMinter.totalSupply();
    ok(
      "totalSupply after burn",
      `${supplyAfterBurn.toString()} (note: totalSupply = totalMinted, not live count)`
    );
  } catch (err) {
    fail("totalSupply after burn", err);
  }

  // =====================================================================
  // PHASE 10: Factory-level operations
  // =====================================================================
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  PHASE 10: Factory-level operations");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const factoryAsOwner = FactoryClient.connect(FACTORY, factoryOwner);

  try {
    const defaults = await factoryAsOwner.getDefaults();
    ok("getDefaults", `feeBps=${defaults.feeBps}, erc20=${defaults.erc20}`);
  } catch (err) {
    fail("getDefaults", err);
  }

  // Set default fees (change then revert)
  try {
    await factoryAsOwner.setDefaultFees(600, 0, 0); // temporarily 6%
    ok("setDefaultFees", "600 bps");
  } catch (err) {
    fail("setDefaultFees", err);
  }

  // Revert default fees back
  try {
    await factoryAsOwner.setDefaultFees(500, 0, 0); // back to 5%
    ok("setDefaultFees (revert to 500)", "500 bps");
  } catch (err) {
    fail("setDefaultFees revert", err);
  }

  // List collections
  try {
    const count = await factoryAsOwner.getCollectionCount();
    const collections = await factoryAsOwner.getCollections(0, count);
    ok("getCollections", `${collections.length} total: ${collections.join(", ").substring(0, 80)}...`);
  } catch (err) {
    fail("getCollections", err);
  }

  // Creator cannot set factory defaults
  const factoryAsCreatorAgain = FactoryClient.connect(FACTORY, creator);

  await expectRevert("Creator setDefaultFees on factory (should revert)", async () => {
    await factoryAsCreatorAgain.setDefaultFees(100, 0, 0);
  });

  await expectRevert("Minter setDefaultFees on factory (should revert)", async () => {
    const factoryAsMinter = FactoryClient.connect(FACTORY, minter);
    await factoryAsMinter.setDefaultFees(100, 0, 0);
  });

  // =====================================================================
  // RESULTS
  // =====================================================================
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║                    TEST RESULTS                         ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
  console.log(`  ✅ Passed:  ${passed}`);
  console.log(`  ❌ Failed:  ${failed}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  📊 Total:   ${passed + failed + skipped}`);
  console.log(`\n  Collection: ${collectionAddress}`);
  console.log("");

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("\n💥 Fatal error:", err);
  process.exitCode = 1;
});
