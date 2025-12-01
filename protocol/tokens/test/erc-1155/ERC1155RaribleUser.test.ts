// <ai_context> TypeScript port of erc-1155/ERC1155RaribleUser.test.js. Tests ERC1155RaribleUser (private collection) token functionality including minting, access control, factory creation, and royalties. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
import type * as ethersTypes from "ethers";

const connection = await network.connect();
const { ethers } = connection;

import {
  type ERC1155Rarible,
  ERC1155Rarible__factory,
  type UpgradeableBeacon,
  UpgradeableBeacon__factory,
  type ERC1155RaribleFactoryC2,
  ERC1155RaribleFactoryC2__factory,
  type TestRoyaltyV2981Calculate,
  TestRoyaltyV2981Calculate__factory,
} from "../../types/ethers-contracts";
import { sign as signMint1155 } from "@rarible/common-sdk/src/mint1155";
import { deployTransparentProxy } from "@rarible/common-sdk/src/deploy";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
const zeroWord = "0x0000000000000000000000000000000000000000000000000000000000000000";
const ZERO = "0x0000000000000000000000000000000000000000";

type Part = { account: string; value: bigint };

function creators(accounts: string[]): Part[] {
  const value = BigInt(10000 / accounts.length);
  return accounts.map((account) => ({ account, value }));
}

function fees(accounts: string[]): Part[] {
  const value = 500n;
  return accounts.map((account) => ({ account, value }));
}

// -----------------------------------------------------------------------------
// Main Test Suite
// -----------------------------------------------------------------------------
describe("ERC1155RaribleUser", function () {
  let token: ERC1155Rarible;
  let tokenOwner: ethersTypes.Signer;
  let accounts: ethersTypes.Signer[];
  let deployer: ethersTypes.Signer;
  let whiteListProxy: ethersTypes.Signer;
  let testRoyaltyV2981Calculate: TestRoyaltyV2981Calculate;

  const name = "FreeMintable";

  before(async () => {
    accounts = await ethers.getSigners();
    [deployer, , , , , whiteListProxy, , , , tokenOwner] = accounts;

    // Deploy TestRoyaltyV2981Calculate
    testRoyaltyV2981Calculate = await new TestRoyaltyV2981Calculate__factory(deployer).deploy();
    await testRoyaltyV2981Calculate.waitForDeployment();
  });

  beforeEach(async () => {
    const { instance } = await deployTransparentProxy<ERC1155Rarible>(ethers, {
      contractName: "ERC1155Rarible",
      initFunction: "__ERC1155RaribleUser_init",
      initArgs: [
        name,
        "TST",
        "ipfs:/",
        "ipfs:/",
        [await whiteListProxy.getAddress()], // operators
        await accounts[6].getAddress(),
        await accounts[7].getAddress(),
        await tokenOwner.getAddress(),
      ],
      proxyOwner: await deployer.getAddress(),
    });
    token = instance;
  });

  async function getSignature(
    tokenId: string,
    tokenURI: string,
    supply: bigint,
    creatorsParts: Part[],
    royaltiesParts: Part[],
    signer: ethersTypes.Signer,
  ): Promise<string> {
    const tokenAddress = await token.getAddress();
    const tokenIdBigInt = BigInt(tokenId);
    return signMint1155(signer, tokenIdBigInt, tokenURI, supply, creatorsParts, royaltiesParts, tokenAddress);
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

  // ---------------------------------------------------------------------------
  // Approval tests
  // ---------------------------------------------------------------------------
  describe("Approvals", () => {
    it("approve for all", async () => {
      const account6Address = await accounts[6].getAddress();
      const account7Address = await accounts[7].getAddress();

      expect(await token.isApprovedForAll(await accounts[1].getAddress(), account6Address)).to.be.true;
      expect(await token.isApprovedForAll(await accounts[1].getAddress(), account7Address)).to.be.true;
    });
  });

  // ---------------------------------------------------------------------------
  // Interface support tests
  // ---------------------------------------------------------------------------
  describe("Interface support", () => {
    it("check for ERC165 interface", async () => {
      expect(await token.supportsInterface("0x01ffc9a7")).to.be.true;
    });

    it("check for mintAndTransfer interface", async () => {
      expect(await token.supportsInterface("0x6db15a0f")).to.be.true;
    });

    it("check for RoyaltiesV2 interface", async () => {
      expect(await token.supportsInterface("0xcad96cca")).to.be.true;
    });

    it("check for ERC1155 interfaces", async () => {
      expect(await token.supportsInterface("0xd9b67a26")).to.be.true;
      expect(await token.supportsInterface("0x0e89341c")).to.be.true;
    });

    it("check for support IERC2981 interface", async () => {
      expect(await token.supportsInterface("0x2a55205a")).to.be.true;
    });
  });

  // ---------------------------------------------------------------------------
  // Royalties tests
  // ---------------------------------------------------------------------------
  describe("Royalties IERC2981", () => {
    it("check Royalties IERC2981", async () => {
      const minter = tokenOwner;
      const minterAddress = await minter.getAddress();
      const transferTo = accounts[2];
      const transferToAddress = await transferTo.getAddress();
      const royaltiesBeneficiary1 = await accounts[3].getAddress();
      const royaltiesBeneficiary2 = await accounts[4].getAddress();
      const royaltiesBeneficiary3 = await accounts[6].getAddress();
      const WEIGHT_PRICE = 1000000n;
      const supply = 5n;
      const mint = 2n;

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";
      const signature = await getSignature(
        tokenId,
        tokenURI,
        supply,
        creators([minterAddress]),
        fees([royaltiesBeneficiary1, royaltiesBeneficiary2, royaltiesBeneficiary3]),
        minter,
      );

      await token.connect(tokenOwner).mintAndTransfer(
        {
          tokenId,
          tokenURI,
          supply,
          creators: creators([minterAddress]),
          royalties: fees([royaltiesBeneficiary1, royaltiesBeneficiary2, royaltiesBeneficiary3]),
          signatures: [signature],
        },
        transferToAddress,
        mint,
      );

      const addressValue = await token.royaltyInfo(tokenId, WEIGHT_PRICE);

      expect(addressValue[0]).to.equal(royaltiesBeneficiary1);
      // 3 beneficiaries, each have 5%(500) in total 15%(1500), but WEIGHT_PRICE = 1000000, and 15% from this is 150000
      expect(addressValue[1]).to.equal(150000n);

      const royaltiesAddress = addressValue[0];
      const royaltiesPercent = addressValue[1];
      const royaltiesPart = await testRoyaltyV2981Calculate.calculateRoyaltiesTest(royaltiesAddress, royaltiesPercent);
      expect(royaltiesPart[0].account).to.equal(royaltiesBeneficiary1);
      expect(royaltiesPart[0].value).to.equal(1500n);
    });
  });

  // ---------------------------------------------------------------------------
  // BaseURI tests
  // ---------------------------------------------------------------------------
  describe("BaseURI", () => {
    it("set new BaseUri, check only owner, check emit event", async () => {
      const oldBaseUri = await token.baseURI();
      const newBaseUriSet = "https://ipfs.rarible-the-best-in-the-World.com";

      // caller is not the owner - should revert
      await expect(token.connect(accounts[1]).setBaseURI(newBaseUriSet)).to.be.revertedWithCustomError(
        token,
        "OwnableUnauthorizedAccount",
      );

      // caller is owner - should succeed
      const tx = await token.connect(tokenOwner).setBaseURI(newBaseUriSet);
      const receipt = await tx.wait();

      const newBaseUri = await token.baseURI();
      expect(newBaseUri).to.equal(newBaseUriSet);
      expect(newBaseUri).to.not.equal(oldBaseUri);

      // Check event
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
      expect(newBaseUri).to.equal(newBaseUriFromEvent);
    });
  });

  // ---------------------------------------------------------------------------
  // Mint and transfer tests (private collection)
  // ---------------------------------------------------------------------------
  describe("Mint and transfer (private collection)", () => {
    it("mint and transfer by proxy. minter is tokenOwner", async () => {
      const minter = tokenOwner;
      const minterAddress = await minter.getAddress();
      const transferTo = accounts[2];
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "/uri";
      const supply = 5n;
      const mint = 2n;

      const signature = await getSignature(tokenId, tokenURI, supply, creators([minterAddress]), [], minter);

      await token.connect(tokenOwner).mintAndTransfer(
        {
          tokenId,
          tokenURI,
          supply,
          creators: creators([minterAddress]),
          royalties: [],
          signatures: [signature],
        },
        transferToAddress,
        mint,
      );

      expect(await token.uri(tokenId)).to.equal("ipfs:/" + tokenURI);
      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);
    });

    it("mint and transfer by minter. minter is tokenOwner", async () => {
      const minter = tokenOwner;
      const minterAddress = await minter.getAddress();
      const transferTo = accounts[2];
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";
      const supply = 5n;
      const mint = 2n;

      await token.connect(minter).mintAndTransfer(
        {
          tokenId,
          tokenURI,
          supply,
          creators: creators([minterAddress]),
          royalties: [],
          signatures: [zeroWord],
        },
        transferToAddress,
        mint,
      );

      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);
    });

    it("mint and transfer by minter. minter is not tokenOwner - should revert", async () => {
      const minter = accounts[1];
      const minterAddress = await minter.getAddress();
      const transferTo = accounts[2];
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";
      const supply = 5n;
      const mint = 2n;

      await expect(
        token.connect(minter).mintAndTransfer(
          {
            tokenId,
            tokenURI,
            supply,
            creators: creators([minterAddress]),
            royalties: [],
            signatures: [zeroWord],
          },
          transferToAddress,
          mint,
        ),
      ).to.be.revertedWith("not owner or minter");
    });

    it("mint and transfer by minter several creators", async () => {
      const minter = tokenOwner;
      const minterAddress = await minter.getAddress();
      const creator2 = accounts[3];
      const creator2Address = await creator2.getAddress();
      const transferTo = accounts[2];
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";
      const supply = 5n;
      const mint = 2n;

      const signature2 = await getSignature(
        tokenId,
        tokenURI,
        supply,
        creators([minterAddress, creator2Address]),
        [],
        creator2,
      );

      await token.connect(minter).mintAndTransfer(
        {
          tokenId,
          tokenURI,
          supply,
          creators: creators([minterAddress, creator2Address]),
          royalties: [],
          signatures: [zeroWord, signature2],
        },
        transferToAddress,
        mint,
      );

      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);
      await checkCreators(tokenId, [minterAddress, creator2Address]);
    });

    it("mint and transfer to self by minter", async () => {
      const minter = tokenOwner;
      const minterAddress = await minter.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";
      const supply = 5n;
      const mint = 2n;

      await token.connect(minter).mintAndTransfer(
        {
          tokenId,
          tokenURI,
          supply,
          creators: creators([minterAddress]),
          royalties: [],
          signatures: [zeroWord],
        },
        minterAddress,
        mint,
      );

      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(mint);
      await checkCreators(tokenId, [minterAddress]);
    });
  });

  // ---------------------------------------------------------------------------
  // Minter access control tests
  // ---------------------------------------------------------------------------
  describe("Minter access control", () => {
    it("mint and transfer with minter access control", async () => {
      const minter = accounts[1];
      const minterAddress = await minter.getAddress();
      const transferTo = accounts[2];
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";
      const supply = 5n;
      const mint = 2n;

      // Should fail - minter is not owner or authorized minter
      await expect(
        token.connect(minter).mintAndTransfer(
          {
            tokenId,
            tokenURI,
            supply,
            creators: creators([minterAddress]),
            royalties: [],
            signatures: [zeroWord],
          },
          transferToAddress,
          mint,
        ),
      ).to.be.revertedWith("not owner or minter");

      // Add minter
      await token.connect(tokenOwner).addMinter(minterAddress);
      expect(await token.isMinter(minterAddress)).to.be.true;
      expect(await token.isMinter(transferToAddress)).to.be.false;

      // Now minting should succeed
      await token.connect(minter).mintAndTransfer(
        {
          tokenId,
          tokenURI,
          supply,
          creators: creators([minterAddress]),
          royalties: [],
          signatures: [zeroWord],
        },
        transferToAddress,
        mint,
      );

      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(0n);
    });

    it("mint and transfer with minter access control and minter signature", async () => {
      const minter = accounts[1];
      const minterAddress = await minter.getAddress();
      const transferTo = accounts[2];
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";
      const supply = 5n;
      const mint = 2n;

      const signature = await getSignature(tokenId, tokenURI, supply, creators([minterAddress]), [], minter);

      // Should fail - minter is not owner or authorized minter
      await expect(
        token.connect(minter).mintAndTransfer(
          {
            tokenId,
            tokenURI,
            supply,
            creators: creators([minterAddress]),
            royalties: [],
            signatures: [signature],
          },
          transferToAddress,
          mint,
        ),
      ).to.be.revertedWith("not owner or minter");

      // Add minter
      await token.connect(tokenOwner).addMinter(minterAddress);
      expect(await token.isMinter(minterAddress)).to.be.true;

      // Now minting should succeed
      await token.connect(minter).mintAndTransfer(
        {
          tokenId,
          tokenURI,
          supply,
          creators: creators([minterAddress]),
          royalties: [],
          signatures: [signature],
        },
        transferToAddress,
        mint,
      );

      expect(await token.balanceOf(transferToAddress, tokenId)).to.equal(mint);
      expect(await token.balanceOf(minterAddress, tokenId)).to.equal(0n);
    });

    it("mint and transfer with minter access control and wrong minter signature", async () => {
      const minter = accounts[1];
      const minterAddress = await minter.getAddress();
      const transferTo = accounts[2];
      const transferToAddress = await transferTo.getAddress();
      const whiteListProxyAddress = await whiteListProxy.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "//uri";
      const supply = 5n;
      const mint = 2n;

      // Sign with wrong account (transferTo instead of minter)
      const signature = await getSignature(tokenId, tokenURI, supply, creators([minterAddress]), [], transferTo);

      // Should fail - wrong signature
      await expect(
        token.connect(minter).mintAndTransfer(
          {
            tokenId,
            tokenURI,
            supply,
            creators: creators([minterAddress]),
            royalties: [],
            signatures: [signature],
          },
          transferToAddress,
          mint,
        ),
      ).to.be.revertedWith("not owner or minter");

      // Add minter
      await token.connect(tokenOwner).addMinter(whiteListProxy);
      expect(await token.isMinter(whiteListProxy)).to.be.true;
      await token.connect(tokenOwner).setApprovalForAll(whiteListProxy, true);

      // Should still fail due to wrong signature when called by whiteListProxy
      await expect(
        token.connect(whiteListProxy).mintAndTransfer(
          {
            tokenId,
            tokenURI,
            supply,
            creators: creators([await whiteListProxy.getAddress()]),
            royalties: [],
            signatures: [signature],
          },
          transferToAddress,
          mint,
        ),
      ).to.be.revertedWith("signature verification error");
    });
  });

  // ---------------------------------------------------------------------------
  // Factory tests
  // ---------------------------------------------------------------------------
  describe("Factory", () => {
    let factory: ERC1155RaribleFactoryC2;
    let beacon: UpgradeableBeacon;

    before(async () => {
      // Deploy implementation
      const impl = await new ERC1155Rarible__factory(deployer).deploy();
      await impl.waitForDeployment();

      // Deploy beacon
      beacon = await new UpgradeableBeacon__factory(deployer).deploy(
        await impl.getAddress(),
        await deployer.getAddress(),
      );
      await beacon.waitForDeployment();

      // Deploy factory with ZERO addresses for transfer proxies (User factory doesn't need them in constructor)
      factory = await new ERC1155RaribleFactoryC2__factory(deployer).deploy(await beacon.getAddress(), ZERO, ZERO);
      await factory.waitForDeployment();
    });

    it("mint and transfer by minter, token create by Factory", async () => {
      const salt = 3n;
      let proxyAddress: string | undefined;
      const tokenOwnerAddress = await tokenOwner.getAddress();

      const addressBeforeDeploy = await factory["getAddress(string,string,string,string,address[],address,uint256)"](
        name,
        "TST",
        "ipfs:/",
        "ipfs:/",
        [],
        tokenOwnerAddress,
        salt,
      );

      const addressWithDifferentSalt = await factory["getAddress(string,string,string,string,address[],address,uint256)"](
        name,
        "TST",
        "ipfs:/",
        "ipfs:/",
        [],
        tokenOwnerAddress,
        salt + 1n,
      );

      const addressWithDifferentData = await factory["getAddress(string,string,string,string,address[],address,uint256)"](
        name,
        "TSA",
        "ipfs:/",
        "ipfs:/",
        [],
        tokenOwnerAddress,
        salt,
      );

      expect(addressBeforeDeploy).to.not.equal(addressWithDifferentSalt);
      expect(addressBeforeDeploy).to.not.equal(addressWithDifferentData);

      // Create token using User factory method
      const tx = await factory
        .connect(tokenOwner)
        ["createToken(string,string,string,string,address[],address,uint256)"](name, "TST", "ipfs:/", "ipfs:/", [], tokenOwnerAddress, salt);
      const receipt = await tx.wait();

      for (const log of receipt?.logs ?? []) {
        try {
          const parsed = factory.interface.parseLog(log);
          if (parsed?.name === "Create1155RaribleUserProxy") {
            proxyAddress = parsed.args.proxy as string;
            break;
          }
        } catch {
          // ignore
        }
      }

      if (!proxyAddress) {
        throw new Error("Create1155RaribleUserProxy event not found");
      }

      expect(proxyAddress).to.equal(addressBeforeDeploy);

      // Create second token with different salt
      let addrToken2: string | undefined;
      const tx2 = await factory
        .connect(tokenOwner)
        ["createToken(string,string,string,string,address[],uint256)"](name, "TST", "ipfs:/", "ipfs:/", [], salt + 1n);
      const receipt2 = await tx2.wait();

      for (const log of receipt2?.logs ?? []) {
        try {
          const parsed = factory.interface.parseLog(log);
          if (parsed?.name === "Create1155RaribleUserProxy") {
            addrToken2 = parsed.args.proxy as string;
            break;
          }
        } catch {
          // ignore
        }
      }
      expect(addrToken2).to.equal(addressWithDifferentSalt);

      // Create third token with different data
      let addrToken3: string | undefined;
      const tx3 = await factory
        .connect(tokenOwner)
        ["createToken(string,string,string,string,address[],uint256)"](name, "TSA", "ipfs:/", "ipfs:/", [], salt);
      const receipt3 = await tx3.wait();

      for (const log of receipt3?.logs ?? []) {
        try {
          const parsed = factory.interface.parseLog(log);
          if (parsed?.name === "Create1155RaribleUserProxy") {
            addrToken3 = parsed.args.proxy as string;
            break;
          }
        } catch {
          // ignore
        }
      }
      expect(addrToken3).to.equal(addressWithDifferentData);

      // Now test minting on the created token
      const tokenByProxy = ERC1155Rarible__factory.connect(proxyAddress, deployer);

      const minter = tokenOwner;
      const minterAddress = await minter.getAddress();
      const transferTo = accounts[2];
      const transferToAddress = await transferTo.getAddress();

      const tokenId = minterAddress + "b00000000000000000000001";
      const tokenURI = "/uri";
      const supply = 5n;
      const mint = 2n;

      await tokenByProxy.connect(minter).mintAndTransfer(
        {
          tokenId,
          tokenURI,
          supply,
          creators: creators([minterAddress]),
          royalties: [],
          signatures: [zeroWord],
        },
        transferToAddress,
        mint,
      );

      expect(await tokenByProxy.uri(tokenId)).to.equal("ipfs:/" + tokenURI);
      expect(await tokenByProxy.balanceOf(transferToAddress, tokenId)).to.equal(mint);
      expect(await tokenByProxy.balanceOf(minterAddress, tokenId)).to.equal(0n);
    });
  });
});