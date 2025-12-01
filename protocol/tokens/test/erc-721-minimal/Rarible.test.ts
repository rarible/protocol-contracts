import { expect } from "chai";
import { network } from "hardhat";
const connection = await network.connect();
const { ethers } = connection;
import type * as ethersTypes from "ethers";
import {
  type ERC721RaribleMinimal,
  ERC721RaribleMinimal__factory,
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
function royalties(accounts: string[]): Part[] {
  return accounts.map((account) => ({ account, value: 500n }));
}
function royaltiesZero(accounts: string[]): Part[] {
  return accounts.map((account) => ({ account, value: 0n }));
}
// -----------------------------------------------------------------------------
// Main Test Suite
// -----------------------------------------------------------------------------
describe("ERC721RaribleMinimal", function () {
  let token: ERC721RaribleMinimal;
  let tokenImplAddress: string;
  let tokenOwner: ethersTypes.Signer;
  let erc1271: TestERC1271;
  let beacon: UpgradeableBeacon;
  let factory: ERC721RaribleFactoryC2;
  let tokenByProxy: ERC721RaribleMinimal;
  let proxyLazy: ERC721LazyMintTransferProxyTest;
  let transferProxy: TransferProxyTest;
  let whiteListProxy: ethersTypes.Signer;
  let accounts: ethersTypes.Signer[];
  let deployer: ethersTypes.Signer;
  const name = "FreeMintableRarible";
  const symbol = "RARI";
  const baseURI = "https://ipfs.rarible.com";
  before(async () => {
    accounts = await ethers.getSigners();
    [deployer, , , , , whiteListProxy] = accounts;
    tokenOwner = accounts[9];
    const { instance: proxyLazyInstance } = await deployTransparentProxy<ERC721LazyMintTransferProxyTest>(ethers, {
      contractName: "ERC721LazyMintTransferProxyTest",
      initFunction: "__ERC721LazyMintTransferProxyTest_init",
      initArgs: [await deployer.getAddress()],
      proxyOwner: await deployer.getAddress(),
    });
    proxyLazy = proxyLazyInstance;
    transferProxy = await new TransferProxyTest__factory(deployer).deploy();
    await transferProxy.waitForDeployment();
    erc1271 = await new TestERC1271__factory(deployer).deploy();
    await erc1271.waitForDeployment();
  });
  beforeEach(async () => {
    const { instance, implementation } = await deployTransparentProxy<ERC721RaribleMinimal>(ethers, {
      contractName: "ERC721RaribleMinimal",
      initFunction: "__ERC721Rarible_init",
      initArgs: [
        name,
        symbol,
        baseURI,
        baseURI,
        await whiteListProxy.getAddress(),
        await proxyLazy.getAddress(),
        await tokenOwner.getAddress(),
      ],
      proxyOwner: await deployer.getAddress(),
    });
    token = instance;
    tokenImplAddress = await implementation.getAddress();
  });
  async function getSignature(
    tokenId: string,
    tokenURI: string,
    creatorsParts: Part[],
    royaltiesParts: Part[],
    signer: ethersTypes.Signer,
  ): Promise<string> {
    const tokenAddress = await token.getAddress();
    const tokenIdBigInt = BigInt(tokenId);
    return signMint721(signer, tokenIdBigInt, tokenURI, creatorsParts, royaltiesParts, tokenAddress);
  }
  async function checkCreators(tokenId: string, expected: string[]) {
    const onChain = await token.getCreators(tokenId);
    expect(onChain.length).to.equal(expected.length);
    const value = BigInt(10000 / expected.length);
    for (let i = 0; i < onChain.length; i++) {
      expect(onChain[i].account).to.equal(expected[i]);
      expect(onChain[i].value).to.equal(value);
    }
  }
  describe("Burn before mint", () => {
    it("minter burns → mintAndTransfer reverts", async () => {
      const minter = accounts[1];
      const minterAddr = await minter.getAddress();
      const tokenId = minterAddr + "b00000000000000000000001";
      const uri = "//uri";
      await token.connect(minter).burn(tokenId);
      await expect(
        token.connect(minter).mintAndTransfer(
          {
            tokenId,
            tokenURI: uri,
            creators: creators([minterAddr]),
            royalties: [],
            signatures: [zeroWord],
          },
          minterAddr,
        ),
      ).to.be.revertedWith("token already burned");
    });
    it("other burns → reverts, minter can still mint", async () => {
      const minter = accounts[1];
      const other = accounts[2];
      const minterAddr = await minter.getAddress();
      const tokenId = minterAddr + "b00000000000000000000001";
      const uri = "//uri";
      await expect(token.connect(other).burn(tokenId)).to.be.revertedWith(
        "ERC721Burnable: caller is not owner, not burn",
      );
      await token.connect(minter).mintAndTransfer(
        {
          tokenId,
          tokenURI: uri,
          creators: creators([minterAddr]),
          royalties: [],
          signatures: [zeroWord],
        },
        minterAddr,
      );
      expect(await token.ownerOf(tokenId)).to.equal(minterAddr);
    });
  });
  describe("Burn after mint", () => {
    it("mint → burn → mint again → reverts", async () => {
      const minter = accounts[1];
      const recipient = accounts[2];
      const minterAddr = await minter.getAddress();
      const tokenId = minterAddr + "b00000000000000000000001";
      const uri = "//uri";
      await token.connect(minter).mintAndTransfer(
        {
          tokenId,
          tokenURI: uri,
          creators: creators([minterAddr]),
          royalties: [],
          signatures: [zeroWord],
        },
        minterAddr,
      );
      await token.connect(minter).burn(tokenId);
      await expect(
        token.connect(minter).mintAndTransfer(
          {
            tokenId,
            tokenURI: uri,
            creators: creators([minterAddr]),
            royalties: [],
            signatures: [zeroWord],
          },
          await recipient.getAddress(),
        ),
      ).to.be.revertedWith("token already burned");
    });
  });
  describe("Factory + Beacon", () => {
    it("creates token via factory and mints successfully", async () => {
      beacon = await new UpgradeableBeacon__factory(deployer).deploy(tokenImplAddress, await tokenOwner.getAddress());
      await beacon.waitForDeployment();
      factory = await new ERC721RaribleFactoryC2__factory(deployer).deploy(
        await beacon.getAddress(),
        await transferProxy.getAddress(),
        await proxyLazy.getAddress(),
      );
      await factory.waitForDeployment();
      const tx = await factory
        .connect(tokenOwner)
        ["createToken(string,string,string,string,uint256)"]("Test", "TEST", baseURI, baseURI, 1n);
      const receipt = await tx.wait();
      let proxyAddr: string | undefined;
      for (const log of receipt?.logs ?? []) {
        try {
          const parsed = factory.interface.parseLog(log);
          if (parsed?.name === "Create721RaribleProxy") {
            proxyAddr = parsed.args.proxy;
            break;
          }
        } catch {}
      }
      if (!proxyAddr) throw new Error("Proxy not created");
      tokenByProxy = ERC721RaribleMinimal__factory.connect(proxyAddr, deployer);
      const minter = tokenOwner;
      const minterAddr = await minter.getAddress();
      const tokenId = minterAddr + "b00000000000000000000001";
      await tokenByProxy.connect(minter).mintAndTransfer(
        {
          tokenId,
          tokenURI: "//uri",
          creators: creators([minterAddr]),
          royalties: [],
          signatures: [zeroWord],
        },
        minterAddr,
      );
      expect(await tokenByProxy.ownerOf(tokenId)).to.equal(minterAddr);
    });
    it("checkPrefix works correctly", async () => {
      beacon = await new UpgradeableBeacon__factory(deployer).deploy(tokenImplAddress, await tokenOwner.getAddress());
      await beacon.waitForDeployment();
      factory = await new ERC721RaribleFactoryC2__factory(deployer).deploy(
        await beacon.getAddress(),
        await transferProxy.getAddress(),
        await proxyLazy.getAddress(),
      );
      await factory.waitForDeployment();
      await factory
        .connect(tokenOwner)
        ["createToken(string,string,string,string,uint256)"]("Test", "TEST", baseURI, baseURI, 1n);
      const proxyAddr = (await factory.queryFilter(factory.filters.Create721RaribleProxy()))[0].args.proxy;
      tokenByProxy = ERC721RaribleMinimal__factory.connect(proxyAddr, deployer);
      const minterAddr = await tokenOwner.getAddress();
      // 1. URI with prefix
      await tokenByProxy.connect(tokenOwner).mintAndTransfer(
        {
          tokenId: minterAddr + "b00000000000000000000001",
          tokenURI: baseURI + "/already/prefixed",
          creators: creators([minterAddr]),
          royalties: [],
          signatures: [zeroWord],
        },
        minterAddr,
      );
      expect(await tokenByProxy.tokenURI(minterAddr + "b00000000000000000000001")).to.equal(
        baseURI + "/already/prefixed",
      );
      // 2. URI without prefix
      await tokenByProxy.connect(tokenOwner).mintAndTransfer(
        {
          tokenId: minterAddr + "b00000000000000000000002",
          tokenURI: "/relative/path",
          creators: creators([minterAddr]),
          royalties: [],
          signatures: [zeroWord],
        },
        minterAddr,
      );
      expect(await tokenByProxy.tokenURI(minterAddr + "b00000000000000000000002")).to.equal(baseURI + "/relative/path");
    });
  });
  it("supports correct interfaces", async () => {
    expect(await token.supportsInterface("0x01ffc9a7")).to.be.true; // ERC165
    expect(await token.supportsInterface("0x8486f69f")).to.be.true; // mintAndTransfer
    expect(await token.supportsInterface("0xcad96cca")).to.be.true; // RoyaltiesV2
    expect(await token.supportsInterface("0x80ac58cd")).to.be.true; // ERC721
    expect(await token.supportsInterface("0x5b5e139f")).to.be.true; // Metadata
    expect(await token.supportsInterface("0x780e9d63")).to.be.true; // Enumerable
  });
  it("default approval for proxies", async () => {
    const user = await accounts[1].getAddress();
    expect(await token.isApprovedForAll(user, await whiteListProxy.getAddress())).to.be.true;
    expect(await token.isApprovedForAll(user, await proxyLazy.getAddress())).to.be.true;
  });
  describe("Royalties IERC2981", () => {
    it("multiple beneficiaries → correct total", async () => {
      const calc = await new TestRoyaltyV2981Calculate__factory(deployer).deploy();
      await calc.waitForDeployment();
      const minter = accounts[1];
      const to = accounts[2];
      const r1 = accounts[3];
      const r2 = accounts[4];
      const r3 = accounts[5];
      const minterAddr = await minter.getAddress();
      const tokenId = minterAddr + "b00000000000000000000001";
      const royaltyParts = royalties([await r1.getAddress(), await r2.getAddress(), await r3.getAddress()]);
      const sig = await getSignature(tokenId, "//uri", creators([minterAddr]), royaltyParts, minter);
      await token.connect(whiteListProxy).mintAndTransfer(
        {
          tokenId,
          tokenURI: "//uri",
          creators: creators([minterAddr]),
          royalties: royaltyParts,
          signatures: [sig],
        },
        await to.getAddress(),
      );
      const [receiver, amount] = await token.royaltyInfo(tokenId, 1_000_000n);
      expect(receiver).to.equal(await r1.getAddress());
      expect(amount).to.equal(150_000n); // 15%
    });
    it("zero royalties → reverts", async () => {
      const minter = accounts[1];
      const minterAddr = await minter.getAddress();
      const tokenId = minterAddr + "b00000000000000000000001";
      const sig = await getSignature(tokenId, "//uri", creators([minterAddr]), royaltiesZero([minterAddr]), minter);
      await expect(
        token.connect(whiteListProxy).mintAndTransfer(
          {
            tokenId,
            tokenURI: "//uri",
            creators: creators([minterAddr]),
            royalties: royaltiesZero([minterAddr]),
            signatures: [sig],
          },
          minterAddr,
        ),
      ).to.be.revertedWith("Royalty value should be positive");
    });
  });
  it("mintAndTransfer via whitelist proxy", async () => {
    const minter = accounts[1];
    const to = accounts[2];
    const minterAddr = await minter.getAddress();
    const tokenId = minterAddr + "b00000000000000000000001";
    const sig = await getSignature(tokenId, "//uri", creators([minterAddr]), [], minter);
    const tx = await token.connect(whiteListProxy).mintAndTransfer(
      {
        tokenId,
        tokenURI: "//uri",
        creators: creators([minterAddr]),
        royalties: [],
        signatures: [sig],
      },
      await to.getAddress(),
    );
    await tx.wait();
    expect(await token.ownerOf(tokenId)).to.equal(await to.getAddress());
    await checkCreators(tokenId, [minterAddr]);
  });
  it("multiple creators — correct order required", async () => {
    const minter = accounts[1];
    const creator2 = accounts[3];
    const to = accounts[2];
    const minterAddr = await minter.getAddress();
    const c2Addr = await creator2.getAddress();
    const tokenId = minterAddr + "b0000000000000000000000";
    const sig1 = await getSignature(tokenId + "1", "//uri", creators([minterAddr, c2Addr]), [], minter);
    const sig2 = await getSignature(tokenId + "1", "//uri", creators([minterAddr, c2Addr]), [], creator2);
    await token.connect(whiteListProxy).mintAndTransfer(
      {
        tokenId: tokenId + "1",
        tokenURI: "//uri",
        creators: creators([minterAddr, c2Addr]),
        royalties: [],
        signatures: [sig1, sig2],
      },
      await to.getAddress(),
    );
    // wrong order → revert
    await expect(
      token.connect(whiteListProxy).mintAndTransfer(
        {
          tokenId: tokenId + "2",
          tokenURI: "//uri",
          creators: creators([minterAddr, c2Addr]),
          royalties: [],
          signatures: [sig2, sig1],
        },
        await to.getAddress(),
      ),
    ).to.be.revertedWith("signature verification error");
  });
  it("ERC1271 contract wallet works", async () => {
    await erc1271.setReturnSuccessfulValidSignature(false);
    const tokenId = (await erc1271.getAddress()) + "b00000000000000000000001";
    await expect(
      token.connect(whiteListProxy).mintAndTransfer(
        {
          tokenId,
          tokenURI: "//uri",
          creators: creators([await erc1271.getAddress()]),
          royalties: [],
          signatures: [zeroWord],
        },
        await accounts[2].getAddress(),
      ),
    ).to.be.revertedWith("signature verification error");
    await erc1271.setReturnSuccessfulValidSignature(true);
    await token.connect(whiteListProxy).mintAndTransfer(
      {
        tokenId,
        tokenURI: "//uri",
        creators: creators([await erc1271.getAddress()]),
        royalties: [],
        signatures: [zeroWord],
      },
      await accounts[2].getAddress(),
    );
  });
});
