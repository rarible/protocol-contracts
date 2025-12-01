import { expect } from "chai";
import { network } from "hardhat";
import type * as ethersTypes from "ethers";

const connection = await network.connect();
const { ethers } = connection;

import {
  type ERC721Rarible,
  ERC721Rarible__factory,
  type TestERC1271,
  TestERC1271__factory,
  type UpgradeableBeacon,
  UpgradeableBeacon__factory,
  type ERC721RaribleFactoryC2,
  ERC721RaribleFactoryC2__factory,
  type ERC721LazyMintTransferProxyTest,
  ERC721LazyMintTransferProxyTest__factory,
  type TransferProxyTest,
  TransferProxyTest__factory,
  type TestRoyaltyV2981Calculate,
  TestRoyaltyV2981Calculate__factory,
} from "../../types/ethers-contracts";

import { sign as signMint721 } from "@rarible/common-sdk/src/mint721";
import { deployTransparentProxy } from "@rarible/common-sdk/src/deploy";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const ZERO = "0x0000000000000000000000000000000000000000";
const zeroWord = "0x0000000000000000000000000000000000000000000000000000000000000000";

type Part = { account: string; value: bigint };

function creators(accounts: string[]): Part[] {
  const value = BigInt(10000 / accounts.length);
  return accounts.map((account) => ({ account, value }));
}

function fees(accounts: string[]): Part[] {
  const value = 500n;
  return accounts.map((account) => ({ account, value }));
}

function feesWithZero(accounts: string[]): Part[] {
  const value = 0n;
  return accounts.map((account) => ({ account, value }));
}

async function expectThrow(p: Promise<unknown>): Promise<void> {
  let failed = false;
  try {
    await p;
  } catch {
    failed = true;
  }
  if (!failed) {
    expect.fail("Expected transaction to be reverted");
  }
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe("ERC721Rarible", function () {
  let token: ERC721Rarible;
  let tokenOwner: ethersTypes.Signer;
  let erc1271: TestERC1271;
  let beacon: UpgradeableBeacon;
  let factory: ERC721RaribleFactoryC2;
  let tokenByProxy: ERC721Rarible;
  let proxyLazy: ERC721LazyMintTransferProxyTest;
  let transferProxy: TransferProxyTest;
  let whiteListProxy: ethersTypes.Signer;

  let accounts: ethersTypes.Signer[];
  let deployer: ethersTypes.Signer;

  const name = "FreeMintableRarible";
  const baseURI = "https://ipfs.rarible.com";

  before(async () => {
    accounts = await ethers.getSigners();
    [deployer] = accounts as [ethersTypes.Signer, ...ethersTypes.Signer[]];
    tokenOwner = accounts[9];
    whiteListProxy = accounts[5];

    // Proxies & helper contracts
    proxyLazy = await new ERC721LazyMintTransferProxyTest__factory(deployer).deploy();
    await proxyLazy.waitForDeployment();

    transferProxy = await new TransferProxyTest__factory(deployer).deploy();
    await transferProxy.waitForDeployment();

    erc1271 = await new TestERC1271__factory(deployer).deploy();
    await erc1271.waitForDeployment();
  });

  beforeEach(async () => {
    const { instance } = await deployTransparentProxy<ERC721Rarible>(ethers, {
      contractName: "ERC721Rarible",
      initFunction: "__ERC721Rarible_init",
      initArgs: [
        name,
        "RARI",
        baseURI,
        baseURI,
        await whiteListProxy.getAddress(),
        await proxyLazy.getAddress(),
        await tokenOwner.getAddress(),
      ],
      proxyOwner: await deployer.getAddress(),
    });
    token = instance;
  });

  // ---------------------------------------------------------------------------
  // Burn before ERC721Rarible
  // ---------------------------------------------------------------------------

  describe("Burn before ERC721Rarible()", () => {
    it("Run burn from minter, mintAndTransfer by the same minter not possible", async () => {
      const minter = accounts[1];
      const transferTo = accounts[4];

      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001"; // hex concat
      const tokenURI = "//uri";

      // burn by minter
      await token.connect(minter).burn(tokenId);

      // try to mint and transfer after burn -> should revert
      await expectThrow(
        token
          .connect(minter)
          .mintAndTransfer(
            { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
            transferToAddress,
          ),
      );
    });

    it("Run burn from another, throw, mintAndTransfer by the same minter is possible", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];

      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";

      // another address tries to burn -> revert
      await expectThrow(token.connect(transferTo).burn(tokenId));

      // mint and transfer is ok
      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          transferToAddress,
        );

      expect(await token.ownerOf(tokenId)).to.equal(transferToAddress);
    });
  });

  // ---------------------------------------------------------------------------
  // Burn after ERC721Rarible
  // ---------------------------------------------------------------------------

  describe("Burn after ERC721Rarible()", () => {
    it("Run mintAndTransfer, burn, mintAndTransfer again by same minter -> throw", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const transferTo2 = accounts[4];

      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();
      const transferTo2Address = await transferTo2.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";

      await token
        .connect(minter)
        .mintAndTransfer(
          { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          transferToAddress,
        );

      await token.connect(transferTo).burn(tokenId);

      await expectThrow(
        token
          .connect(minter)
          .mintAndTransfer(
            { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
            transferTo2Address,
          ),
      );
    });

    it("Run transferFromOrMint, burn, transferFromOrMint again by same minter -> throw", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];

      const minterAddress = await minter.getAddress();
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";

      await token
        .connect(minter)
        .transferFromOrMint(
          { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          minterAddress,
          transferToAddress,
        );

      expect(await token.ownerOf(tokenId)).to.equal(transferToAddress);

      await token.connect(transferTo).burn(tokenId);

      await expectThrow(
        token
          .connect(minter)
          .transferFromOrMint(
            { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
            minterAddress,
            transferToAddress,
          ),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Factory / Beacon tests
  // ---------------------------------------------------------------------------

  it("mint and transfer by minter, and token created by ERC721Factory", async () => {
    const tokenAddress = await token.getAddress();
    const tokenOwnerAddress = await tokenOwner.getAddress();
    const transferProxyAddress = await transferProxy.getAddress();
    const proxyLazyAddress = await proxyLazy.getAddress();

    // OZ 5.4.0 UpgradeableBeacon(implementation, initialOwner)
    beacon = await new UpgradeableBeacon__factory(deployer).deploy(tokenAddress, tokenOwnerAddress);
    await beacon.waitForDeployment();

    factory = await new ERC721RaribleFactoryC2__factory(deployer).deploy(
      await beacon.getAddress(),
      transferProxyAddress,
      proxyLazyAddress,
    );
    await factory.waitForDeployment();

    const tx = await factory
      .connect(tokenOwner)
      ["createToken(string,string,string,string,uint256)"]("name", "RARI", baseURI, baseURI, 1n);
    const receipt = await tx.wait();

    let proxyAddress: string | undefined;
    const event = receipt?.logs?.find(
      (log) => (log as ethersTypes.EventLog).fragment?.name === "Create721RaribleProxy",
    ) as ethersTypes.EventLog | undefined;
    proxyAddress = event?.args.proxy as string;

    tokenByProxy = ERC721Rarible__factory.connect(proxyAddress, deployer);

    const minter = tokenOwner;
    const minterAddress = await minter.getAddress();

    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";

    const txMint = await tokenByProxy
      .connect(minter)
      .mintAndTransfer(
        { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
        minterAddress,
      );
    const mintReceipt = await txMint.wait();

    const transferEvents = await tokenByProxy.queryFilter(
      tokenByProxy.filters.Transfer(undefined, undefined, undefined),
      mintReceipt?.blockNumber,
      mintReceipt?.blockNumber,
    );

    expect(transferEvents.length).to.equal(1);

    const transferEvent = transferEvents[0];

    // from / to are strings, tokenId is bigint
    expect(transferEvent?.args.from).to.equal(ZERO);
    expect(transferEvent?.args.to).to.equal(minterAddress);
    expect("0x" + transferEvent?.args.tokenId.toString(16)).to.equal(tokenId.toLowerCase());

    expect(await tokenByProxy.ownerOf(tokenId)).to.equal(minterAddress);
  });

  it("checkPrefix should work correctly", async () => {
    const tokenAddress = await token.getAddress();
    const tokenOwnerAddress = await tokenOwner.getAddress();
    const transferProxyAddress = await transferProxy.getAddress();
    const proxyLazyAddress = await proxyLazy.getAddress();

    beacon = await new UpgradeableBeacon__factory(deployer).deploy(tokenAddress, tokenOwnerAddress);
    await beacon.waitForDeployment();

    factory = await new ERC721RaribleFactoryC2__factory(deployer).deploy(
      await beacon.getAddress(),
      transferProxyAddress,
      proxyLazyAddress,
    );
    await factory.waitForDeployment();

    const baseUri = baseURI;
    const tx = await factory
      .connect(tokenOwner)
      ["createToken(string,string,string,string,uint256)"]("name", "RARI", baseUri, baseURI, 1n);
    const receipt = await tx.wait();

    let proxyAddress: string | undefined;
    for (const log of receipt?.logs ?? []) {
      try {
        const parsed = factory.interface.parseLog(log);
        if (parsed?.name === "Create721RaribleProxy") {
          proxyAddress = parsed.args.proxy as string;
          break;
        }
      } catch {
        // ignore
      }
    }
    if (!proxyAddress) {
      throw new Error("Create721RaribleProxy event not found");
    }

    tokenByProxy = ERC721Rarible__factory.connect(proxyAddress, deployer);

    const minter = tokenOwner;
    const minterAddress = await minter.getAddress();

    // 1) tokenURI already has baseUri prefix
    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = baseUri + "/12345/456";
    await tokenByProxy
      .connect(minter)
      .mintAndTransfer(
        { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
        minterAddress,
      );
    expect(await tokenByProxy.tokenURI(tokenId)).to.equal(tokenURI);

    // 2) tokenURI without prefix
    const tokenId1 = minterAddress + "b00000000000000000000002";
    const tokenURI1 = "/12345/123512512/12312312";
    await tokenByProxy
      .connect(minter)
      .mintAndTransfer(
        { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
        minterAddress,
      );
    expect(await tokenByProxy.tokenURI(tokenId1)).to.equal(baseUri + tokenURI1);

    // 3) another tokenURI without prefix
    const tokenId2 = minterAddress + "b00000000000000000000003";
    const tokenURI2 = "/12345/";
    await tokenByProxy
      .connect(minter)
      .mintAndTransfer(
        { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
        minterAddress,
      );
    expect(await tokenByProxy.tokenURI(tokenId2)).to.equal(baseUri + tokenURI2);
  });

  // ---------------------------------------------------------------------------
  // Interface support / approvals
  // ---------------------------------------------------------------------------

  it("check for ERC165/interface support", async () => {
    expect(await token.supportsInterface("0x01ffc9a7")).to.equal(true); // ERC165
  });

  it("check for mintAndTransfer interface", async () => {
    expect(await token.supportsInterface("0x8486f69f")).to.equal(true);
  });

  it("check for RoyaltiesV2 interface", async () => {
    expect(await token.supportsInterface("0xcad96cca")).to.equal(true);
  });

  it("check for IERC2981 interface", async () => {
    expect(await token.supportsInterface("0x2a55205a")).to.equal(true);
  });

  it("check for ERC721 interfaces", async () => {
    expect(await token.supportsInterface("0x80ac58cd")).to.equal(true); // ERC721
    expect(await token.supportsInterface("0x5b5e139f")).to.equal(true); // metadata
    expect(await token.supportsInterface("0x780e9d63")).to.equal(true); // enumerable
  });

  it("approve for all", async () => {
    const account1 = accounts[1];
    const account1Address = await account1.getAddress();
    const whiteListProxyAddress = await whiteListProxy.getAddress();
    const proxyLazyAddress = await proxyLazy.getAddress();

    expect(await token.isApprovedForAll(account1Address, whiteListProxyAddress)).to.equal(true);
    expect(await token.isApprovedForAll(account1Address, proxyLazyAddress)).to.equal(true);
  });

  it("set new BaseUri, only owner, emits event", async () => {
    const oldBaseUri = await token.baseURI();
    const newBaseUri = "https://ipfs.rarible-the-best-in-the-World.com";

    // caller is not owner -> revert
    await expectThrow(token.setBaseURI(newBaseUri));

    const tokenOwnerAddress = await tokenOwner.getAddress();
    const tx = await token.connect(tokenOwner).setBaseURI(newBaseUri);
    const receipt = await tx.wait();

    const currentBaseUri = await token.baseURI();
    expect(currentBaseUri).to.equal(newBaseUri);
    expect(currentBaseUri).not.to.equal(oldBaseUri);

    // Check BaseUriChanged event
    let newBaseUriFromEvent: string | undefined;
    for (const log of receipt?.logs ?? []) {
      try {
        const parsed = token.interface.parseLog(log);
        if (parsed?.name === "BaseUriChanged") {
          newBaseUriFromEvent = parsed.args.newBaseURI as string;
          break;
        }
      } catch {
        // ignore
      }
    }
    expect(newBaseUriFromEvent).to.equal(newBaseUri);
  });

  // ---------------------------------------------------------------------------
  // IERC2981 / royalties tests
  // ---------------------------------------------------------------------------

  it("check Royalties IERC2981, with 3 royaltiesBeneficiary", async () => {
    const testRoyalty = await new TestRoyaltyV2981Calculate__factory(deployer).deploy();
    await testRoyalty.waitForDeployment();

    const minter = accounts[1];
    const transferTo = accounts[2];
    const royaltiesBeneficiary1 = accounts[3];
    const royaltiesBeneficiary2 = accounts[4];
    const royaltiesBeneficiary3 = accounts[6];

    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();
    const rb1 = await royaltiesBeneficiary1.getAddress();
    const rb2 = await royaltiesBeneficiary2.getAddress();
    const rb3 = await royaltiesBeneficiary3.getAddress();

    const WEIGHT_PRICE = 1_000_000n;
    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";

    const royaltyParts = fees([rb1, rb2, rb3]); // 5% each => 15% total

    const signature = await getSignature(tokenId, tokenURI, creators([minterAddress]), royaltyParts, minter);

    await token
      .connect(whiteListProxy)
      .mintAndTransfer(
        { tokenId, tokenURI, creators: creators([minterAddress]), royalties: royaltyParts, signatures: [signature] },
        transferToAddress,
      );

    const [royaltiesAddress, royaltiesAmount] = await token.royaltyInfo(tokenId, WEIGHT_PRICE);

    expect(royaltiesAddress).to.equal(rb1);
    expect(royaltiesAmount).to.equal(150_000n); // 15% of 1_000_000

    const royaltiesPart = await testRoyalty.calculateRoyaltiesTest(royaltiesAddress, royaltiesAmount);

    expect(royaltiesPart[0].account).to.equal(rb1);
    expect(royaltiesPart[0].value).to.equal(1500n);
  });

  it("check Royalties IERC2981, with 3 royaltiesBeneficiary zero fee, throw", async () => {
    const testRoyalty = await new TestRoyaltyV2981Calculate__factory(deployer).deploy();
    await testRoyalty.waitForDeployment();

    const minter = accounts[1];
    const transferTo = accounts[2];
    const rb1 = accounts[3];
    const rb2 = accounts[4];
    const rb3 = accounts[6];

    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();
    const a1 = await rb1.getAddress();
    const a2 = await rb2.getAddress();
    const a3 = await rb3.getAddress();

    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";

    const royaltiesZero = feesWithZero([a1, a2, a3]);

    const signature = await getSignature(tokenId, tokenURI, creators([minterAddress]), royaltiesZero, minter);

    await expectThrow(
      token
        .connect(whiteListProxy)
        .mintAndTransfer(
          { tokenId, tokenURI, creators: creators([minterAddress]), royalties: royaltiesZero, signatures: [signature] },
          transferToAddress,
        ),
    );
  });

  it("check Royalties IERC2981, with only 1 royaltiesBeneficiary", async () => {
    const testRoyalty = await new TestRoyaltyV2981Calculate__factory(deployer).deploy();
    await testRoyalty.waitForDeployment();

    const minter = accounts[1];
    const transferTo = accounts[2];
    const rb1 = accounts[3];

    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();
    const a1 = await rb1.getAddress();

    const WEIGHT_PRICE = 1_000_000n;
    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";

    const royaltiesOne = fees([a1]);

    const signature = await getSignature(tokenId, tokenURI, creators([minterAddress]), royaltiesOne, minter);

    await token
      .connect(whiteListProxy)
      .mintAndTransfer(
        { tokenId, tokenURI, creators: creators([minterAddress]), royalties: royaltiesOne, signatures: [signature] },
        transferToAddress,
      );

    const [royaltiesAddress, royaltiesAmount] = await token.royaltyInfo(tokenId, WEIGHT_PRICE);

    expect(royaltiesAddress).to.equal(a1);
    expect(royaltiesAmount).to.equal(50_000n); // 5%

    const royaltiesPart = await testRoyalty.calculateRoyaltiesTest(royaltiesAddress, royaltiesAmount);

    expect(royaltiesPart[0].account).to.equal(a1);
    expect(royaltiesPart[0].value).to.equal(500n);
  });

  it("check Royalties IERC2981, with 0 royaltiesBeneficiary", async () => {
    const testRoyalty = await new TestRoyaltyV2981Calculate__factory(deployer).deploy();
    await testRoyalty.waitForDeployment();

    const minter = accounts[1];
    const transferTo = accounts[2];

    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();

    const WEIGHT_PRICE = 1_000_000n;
    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";

    const royaltiesEmpty: Part[] = [];

    const signature = await getSignature(tokenId, tokenURI, creators([minterAddress]), royaltiesEmpty, minter);

    await token
      .connect(whiteListProxy)
      .mintAndTransfer(
        { tokenId, tokenURI, creators: creators([minterAddress]), royalties: royaltiesEmpty, signatures: [signature] },
        transferToAddress,
      );

    const [royaltiesAddress, royaltiesAmount] = await token.royaltyInfo(tokenId, WEIGHT_PRICE);

    expect(royaltiesAddress).to.equal(ZERO);
    expect(royaltiesAmount).to.equal(0n);

    const royaltiesPart = await testRoyalty.calculateRoyaltiesTest(royaltiesAddress, royaltiesAmount);
    expect(royaltiesPart.length).to.equal(0);
  });

  // ---------------------------------------------------------------------------
  // mintAndTransfer / signatures / approvals
  // ---------------------------------------------------------------------------

  it("mint and transfer by whitelist proxy", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];

    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();

    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";

    const feesEmpty: Part[] = [];

    const signature = await getSignature(tokenId, tokenURI, creators([minterAddress]), feesEmpty, minter);

    const tx = await token
      .connect(whiteListProxy)
      .mintAndTransfer(
        { tokenId, tokenURI, creators: creators([minterAddress]), royalties: feesEmpty, signatures: [signature] },
        transferToAddress,
      );
    const receipt = await tx.wait();

    const transferEvents = await token.queryFilter(
      token.filters.Transfer(undefined, undefined, undefined),
      receipt?.blockNumber,
      receipt?.blockNumber,
    );

    expect(transferEvents.length).to.equal(2);
    const transfer0 = transferEvents[0].args;
    const transfer1 = transferEvents[1].args;

    expect(transfer0.from).to.equal(ZERO);
    expect(transfer0.to).to.equal(minterAddress);
    expect("0x" + transfer0.tokenId.toString(16)).to.equal(tokenId.toLowerCase());

    expect(transfer1.from).to.equal(minterAddress);
    expect(transfer1.to).to.equal(transferToAddress);
    expect("0x" + transfer1.tokenId.toString(16)).to.equal(tokenId.toLowerCase());

    expect(await token.ownerOf(tokenId)).to.equal(transferToAddress);
    await checkCreators(tokenId, [minterAddress]);
  });

  it("mint and transfer by whitelist proxy. several creators", async () => {
    const minter = accounts[1];
    const creator2 = accounts[3];
    const transferTo = accounts[2];

    const minterAddress = await minter.getAddress();
    const creator2Address = await creator2.getAddress();
    const transferToAddress = await transferTo.getAddress();

    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";

    const feesEmpty: Part[] = [];

    const creatorList = [minterAddress, creator2Address];
    const creatorsPart = creators(creatorList);

    const signature1 = await getSignature(tokenId, tokenURI, creatorsPart, feesEmpty, minter);
    const signature2 = await getSignature(tokenId, tokenURI, creatorsPart, feesEmpty, creator2);

    await token
      .connect(whiteListProxy)
      .mintAndTransfer(
        { tokenId, tokenURI, creators: creatorsPart, royalties: feesEmpty, signatures: [signature1, signature2] },
        transferToAddress,
      );

    expect(await token.ownerOf(tokenId)).to.equal(transferToAddress);
    await checkCreators(tokenId, [minterAddress, creator2Address]);
  });

  it("mint and transfer by whitelist proxy. several creators. minter is not first", async () => {
    const minter = accounts[1];
    const creator2 = accounts[3];
    const transferTo = accounts[2];

    const minterAddress = await minter.getAddress();
    const creator2Address = await creator2.getAddress();
    const transferToAddress = await transferTo.getAddress();

    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";

    const feesEmpty: Part[] = [];

    const creatorList = [creator2Address, minterAddress];
    const creatorsPart = creators(creatorList);

    const signature1 = await getSignature(tokenId, tokenURI, creatorsPart, feesEmpty, minter);
    const signature2 = await getSignature(tokenId, tokenURI, creatorsPart, feesEmpty, creator2);

    await expectThrow(
      token
        .connect(whiteListProxy)
        .mintAndTransfer(
          { tokenId, tokenURI, creators: creatorsPart, royalties: feesEmpty, signatures: [signature2, signature1] },
          transferToAddress,
        ),
    );
  });

  it("mint and transfer by whitelist proxy. several creators. wrong order of signatures", async () => {
    const minter = accounts[1];
    const creator2 = accounts[3];
    const transferTo = accounts[2];

    const minterAddress = await minter.getAddress();
    const creator2Address = await creator2.getAddress();
    const transferToAddress = await transferTo.getAddress();

    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";
    const feesEmpty: Part[] = [];

    const creatorList = [minterAddress, creator2Address];
    const creatorsPart = creators(creatorList);

    const signature1 = await getSignature(tokenId, tokenURI, creatorsPart, feesEmpty, minter);
    const signature2 = await getSignature(tokenId, tokenURI, creatorsPart, feesEmpty, creator2);

    await expectThrow(
      token
        .connect(whiteListProxy)
        .mintAndTransfer(
          { tokenId, tokenURI, creators: creatorsPart, royalties: feesEmpty, signatures: [signature2, signature1] },
          transferToAddress,
        ),
    );
  });

  it("mint and transfer by approved proxy for all", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const proxy = accounts[5];

    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();
    const proxyAddress = await proxy.getAddress();

    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";

    const feesEmpty: Part[] = [];

    const signature = await getSignature(tokenId, tokenURI, creators([minterAddress]), feesEmpty, minter);

    await token.connect(minter).setApprovalForAll(proxyAddress, true);

    const tx = await token
      .connect(proxy)
      .mintAndTransfer(
        { tokenId, tokenURI, creators: creators([minterAddress]), royalties: feesEmpty, signatures: [signature] },
        transferToAddress,
      );
    await tx.wait();

    expect(await token.ownerOf(tokenId)).to.equal(transferToAddress);
  });

  it("mint and transfer by approved proxy for tokenId (approval before mint) -> revert", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const proxy = accounts[5];

    const minterAddress = await minter.getAddress();
    const tokenId = minterAddress + "b00000000000000000000001";

    // approve for nonexistent token -> revert
    await expectThrow(token.connect(minter).approve(await proxy.getAddress(), tokenId));
  });

  it("mint and transfer by minter", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];

    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();

    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";

    await token
      .connect(minter)
      .mintAndTransfer(
        { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
        transferToAddress,
      );

    expect(await token.ownerOf(tokenId)).to.equal(transferToAddress);
  });

  it("transferFromOrMint from minter. not yet minted", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];

    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();

    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";

    await token
      .connect(minter)
      .transferFromOrMint(
        { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
        minterAddress,
        transferToAddress,
      );

    expect(await token.ownerOf(tokenId)).to.equal(transferToAddress);
  });

  it("transferFromOrMint from minter. already minted", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];

    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();

    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";

    await token
      .connect(minter)
      .mintAndTransfer(
        { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
        minterAddress,
      );

    await token
      .connect(minter)
      .transferFromOrMint(
        { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
        minterAddress,
        transferToAddress,
      );

    await expectThrow(
      token
        .connect(minter)
        .transferFromOrMint(
          { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          minterAddress,
          transferToAddress,
        ),
    );

    expect(await token.ownerOf(tokenId)).to.equal(transferToAddress);
  });

  it("transferFromOrMint when not minter. not yet minted", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const other = accounts[5];

    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();
    const otherAddress = await other.getAddress();

    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";

    await expectThrow(
      token
        .connect(transferTo)
        .transferFromOrMint(
          { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
          minterAddress,
          transferToAddress,
        ),
    );

    await token
      .connect(minter)
      .transferFromOrMint(
        { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
        minterAddress,
        transferToAddress,
      );

    await token
      .connect(transferTo)
      .transferFromOrMint(
        { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
        transferToAddress,
        otherAddress,
      );

    expect(await token.ownerOf(tokenId)).to.equal(otherAddress);
  });

  it("mint and transfer to self by minter", async () => {
    const minter = accounts[1];
    const minterAddress = await minter.getAddress();

    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";

    await token
      .connect(minter)
      .mintAndTransfer(
        { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
        minterAddress,
      );

    expect(await token.ownerOf(tokenId)).to.equal(minterAddress);
  });

  it("mint and transfer with signature of not minter", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];

    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();

    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";

    const signature = await getSignature(tokenId, tokenURI, creators([minterAddress]), [], transferTo);

    await expectThrow(
      token
        .connect(whiteListProxy)
        .mintAndTransfer(
          { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [signature] },
          transferToAddress,
        ),
    );
  });

  it("mint and transfer without approval", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const notApproved = accounts[3];

    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();

    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";

    const signature = await getSignature(tokenId, tokenURI, creators([minterAddress]), [], minter);

    await expectThrow(
      token
        .connect(notApproved)
        .mintAndTransfer(
          { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [signature] },
          transferToAddress,
        ),
    );
  });

  it("standard transfer from owner", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];

    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();

    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";

    await token
      .connect(minter)
      .mintAndTransfer(
        { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
        minterAddress,
      );

    expect(await token.ownerOf(tokenId)).to.equal(minterAddress);

    await token.connect(minter).transferFrom(minterAddress, transferToAddress, tokenId);

    expect(await token.ownerOf(tokenId)).to.equal(transferToAddress);
  });

  it("standard transfer by approved contract (whitelistProxy)", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];

    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();
    const whiteListProxyAddress = await whiteListProxy.getAddress();

    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";

    await token
      .connect(minter)
      .mintAndTransfer(
        { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
        minterAddress,
      );

    expect(await token.ownerOf(tokenId)).to.equal(minterAddress);

    await token.connect(whiteListProxy).transferFrom(minterAddress, transferToAddress, tokenId);

    expect(await token.ownerOf(tokenId)).to.equal(transferToAddress);
  });

  it("standard transfer by not approved contract", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const notApproved = accounts[8];

    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();

    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";

    await token
      .connect(minter)
      .mintAndTransfer(
        { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
        minterAddress,
      );

    expect(await token.ownerOf(tokenId)).to.equal(minterAddress);

    await expectThrow(token.connect(notApproved).transferFrom(minterAddress, transferToAddress, tokenId));
  });

  it("signature by contract wallet ERC1271, with whitelist proxy", async () => {
    const transferTo = accounts[2];

    const erc1271Address = await erc1271.getAddress();
    const transferToAddress = await transferTo.getAddress();

    const tokenId = erc1271Address + "b00000000000000000000001";
    const tokenURI = "//uri";

    // First call should revert (isValidSignature returns false)
    await expectThrow(
      token
        .connect(whiteListProxy)
        .mintAndTransfer(
          { tokenId, tokenURI, creators: creators([erc1271Address]), royalties: [], signatures: [zeroWord] },
          transferToAddress,
        ),
    );

    // Now enable ERC1271 success
    await erc1271.setReturnSuccessfulValidSignature(true);

    await token
      .connect(whiteListProxy)
      .mintAndTransfer(
        { tokenId, tokenURI, creators: creators([erc1271Address]), royalties: [], signatures: [zeroWord] },
        transferToAddress,
      );

    expect(await token.ownerOf(tokenId)).to.equal(transferToAddress);
  });

  // ---------------------------------------------------------------------------
  // Shared helpers using current token instance
  // ---------------------------------------------------------------------------

  async function getSignature(
    tokenId: string,
    tokenURI: string,
    creatorsParts: Part[],
    feesParts: Part[],
    signer: ethersTypes.Signer,
  ): Promise<string> {
    const tokenAddress = await token.getAddress();
    const tokenIdBigInt = BigInt(tokenId);

    return signMint721(signer, tokenIdBigInt, tokenURI, creatorsParts, feesParts, tokenAddress);
  }

  async function checkCreators(tokenId: string, expectedAddresses: string[]): Promise<void> {
    const onchainCreators = await token.getCreators(tokenId);
    expect(onchainCreators.length).to.equal(expectedAddresses.length);
    const value = BigInt(10000 / expectedAddresses.length);

    for (let i = 0; i < onchainCreators.length; i++) {
      const [account, v] = onchainCreators[i];
      expect(account).to.equal(expectedAddresses[i]);
      expect(v).to.equal(value);
    }
  }
});
