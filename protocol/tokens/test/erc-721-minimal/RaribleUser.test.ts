import { expect } from "chai";
import { network } from "hardhat";
import type * as ethersTypes from "ethers";
const connection = await network.connect();
const { ethers } = connection;
import {
  type ERC721RaribleMinimal,
  ERC721RaribleMinimal__factory,
  type TestRoyaltyV2981Calculate,
  TestRoyaltyV2981Calculate__factory,
} from "../../types/ethers-contracts";
import { sign as signMint721 } from "@rarible/common-sdk/src/mint721";
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
describe("ERC721RaribleUser", function () {
  let token: ERC721RaribleMinimal;
  let tokenOwner: ethersTypes.Signer;
  let accounts: ethersTypes.Signer[];
  let deployer: ethersTypes.Signer;
  const name = "FreeMintableRarible";
  const symbol = "RARI";
  const baseURI = "https://ipfs.rarible.com";
  const contractURI = "https://ipfs.rarible.com";
  before(async () => {
    accounts = await ethers.getSigners();
    [deployer, , , , , , , , , tokenOwner] = accounts;
  });
  beforeEach(async () => {
    const { instance } = await deployTransparentProxy<ERC721RaribleMinimal>(ethers, {
      contractName: "ERC721RaribleMinimal",
      initFunction: "__ERC721RaribleUser_init",
      initArgs: [
        name,
        symbol,
        baseURI,
        contractURI,
        [],
        ZERO,
        ZERO,
        await tokenOwner.getAddress(),
      ],
      proxyOwner: await deployer.getAddress(),
    });
    token = instance;
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
  it("check for ERC165 interface", async () => {
    expect(await token.supportsInterface("0x01ffc9a7")).to.be.true;
  });
  it("check for mintAndTransfer interface", async () => {
    expect(await token.supportsInterface("0x8486f69f")).to.be.true;
  });
  it("check for RoyaltiesV2 interface", async () => {
    expect(await token.supportsInterface("0xcad96cca")).to.be.true;
  });
  it("check for ERC721 interfaces", async () => {
    expect(await token.supportsInterface("0x80ac58cd")).to.be.true;
    expect(await token.supportsInterface("0x5b5e139f")).to.be.true;
    expect(await token.supportsInterface("0x780e9d63")).to.be.true;
  });
  it("set new BaseUri, check only owner, check emit event", async () => {
    const oldBaseUri = await token.baseURI();
    const newBaseUriSet = "https://ipfs.rarible-the-best-in-the-World.com";
    await expect(token.setBaseURI(newBaseUriSet)).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    const tx = await token.connect(tokenOwner).setBaseURI(newBaseUriSet);
    const newBaseUri = await token.baseURI();
    expect(newBaseUri).to.equal(newBaseUriSet);
    expect(newBaseUri).to.not.equal(oldBaseUri);
    const receipt = await tx.wait();
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
  it("check for support IERC2981 interface", async () => {
    expect(await token.supportsInterface("0x2a55205a")).to.be.true;
  });
  it("check Royalties IERC2981", async () => {
    const testRoyaltyV2981Calculate = await new TestRoyaltyV2981Calculate__factory(deployer).deploy();
    await testRoyaltyV2981Calculate.waitForDeployment();
    const minter = tokenOwner;
    const transferTo = accounts[2];
    const royaltiesBeneficiary1 = accounts[3];
    const royaltiesBeneficiary2 = accounts[4];
    const royaltiesBeneficiary3 = accounts[6];
    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();
    const WEIGHT_PRICE = 1000000n;
    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";
    const royalties = fees([
      await royaltiesBeneficiary1.getAddress(),
      await royaltiesBeneficiary2.getAddress(),
      await royaltiesBeneficiary3.getAddress(),
    ]);
    const signature = await getSignature(
      tokenId,
      tokenURI,
      creators([minterAddress]),
      royalties,
      minter,
    );
    const tx = await token
      .connect(tokenOwner)
      .mintAndTransfer(
        {
          tokenId,
          tokenURI,
          creators: creators([minterAddress]),
          royalties,
          signatures: [signature],
        },
        transferToAddress,
      );
    await tx.wait();
    const [receiver, amount] = await token.royaltyInfo(tokenId, WEIGHT_PRICE);
    expect(receiver).to.equal(await royaltiesBeneficiary1.getAddress());
    expect(amount).to.equal(150000n);
    const royaltiesAddress = receiver;
    const royaltiesPercent = amount;
    const royaltiesPart = await testRoyaltyV2981Calculate.calculateRoyaltiesTest(royaltiesAddress, royaltiesPercent);
    expect(royaltiesPart[0].account).to.equal(await royaltiesBeneficiary1.getAddress());
    expect(royaltiesPart[0].value).to.equal(1500n);
  });
  it("mint and transfer by whitelist proxy. minter is tokenOwner", async () => {
    const minter = tokenOwner;
    const transferTo = accounts[2];
    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();
    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";
    const royalties: Part[] = [];
    const signature = await getSignature(tokenId, tokenURI, creators([minterAddress]), royalties, minter);
    await token
      .connect(tokenOwner)
      .mintAndTransfer(
        {
          tokenId,
          tokenURI,
          creators: creators([minterAddress]),
          royalties,
          signatures: [signature],
        },
        transferToAddress,
      );
    expect(await token.ownerOf(tokenId)).to.equal(transferToAddress);
    await checkCreators(tokenId, [minterAddress]);
  });
  it("mint and transfer by whitelist proxy. minter is not tokenOwner", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();
    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";
    const royalties: Part[] = [];
    const signature = await getSignature(tokenId, tokenURI, creators([minterAddress]), royalties, minter);
    await expect(
      token.mintAndTransfer(
        {
          tokenId,
          tokenURI,
          creators: creators([minterAddress]),
          royalties,
          signatures: [signature],
        },
        transferToAddress,
      ),
    ).to.be.revertedWith("not owner or minter");
  });
  it("mint and transfer by whitelist proxy. several creators", async () => {
    const minter = tokenOwner;
    const creator2 = accounts[3];
    const transferTo = accounts[2];
    const minterAddress = await minter.getAddress();
    const creator2Address = await creator2.getAddress();
    const transferToAddress = await transferTo.getAddress();
    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";
    const royalties: Part[] = [];
    const creatorsList = [minterAddress, creator2Address];
    const signature1 = await getSignature(tokenId, tokenURI, creators(creatorsList), royalties, minter);
    const signature2 = await getSignature(tokenId, tokenURI, creators(creatorsList), royalties, creator2);
    await token
      .connect(tokenOwner)
      .mintAndTransfer(
        {
          tokenId,
          tokenURI,
          creators: creators(creatorsList),
          royalties,
          signatures: [signature1, signature2],
        },
        transferToAddress,
      );
    expect(await token.ownerOf(tokenId)).to.equal(transferToAddress);
    await checkCreators(tokenId, [minterAddress, creator2Address]);
  });
  it("mint and transfer by minter. minter is tokenOwner", async () => {
    const minter = tokenOwner;
    const transferTo = accounts[2];
    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();
    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";
    const tx = await token
      .connect(minter)
      .mintAndTransfer(
        {
          tokenId,
          tokenURI,
          creators: creators([minterAddress]),
          royalties: [],
          signatures: [zeroWord],
        },
        transferToAddress,
      );
    await tx.wait();
    expect(await token.ownerOf(tokenId)).to.equal(transferToAddress);
    const txTransfer = await token.connect(transferTo).transferFrom(transferToAddress, minterAddress, tokenId);
    await txTransfer.wait();
  });
  it("mint and transfer by minter. minter is not tokenOwner", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();
    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";
    await expect(
      token
        .connect(minter)
        .mintAndTransfer(
          {
            tokenId,
            tokenURI,
            creators: creators([minterAddress]),
            royalties: [],
            signatures: [zeroWord],
          },
          transferToAddress,
        ),
    ).to.be.revertedWith("not owner or minter");
  });
  it("mint and transfer to self by minter. minter is not tokenOwner", async () => {
    const minter = accounts[1];
    const transferTo = minter;
    const minterAddress = await minter.getAddress();
    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";
    await expect(
      token
        .connect(minter)
        .mintAndTransfer(
          {
            tokenId,
            tokenURI,
            creators: creators([minterAddress]),
            royalties: [],
            signatures: [zeroWord],
          },
          minterAddress,
        ),
    ).to.be.revertedWith("not owner or minter");
  });
  it("mint and transfer with minter access control", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();
    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";
    await expect(
      token
        .connect(minter)
        .mintAndTransfer(
          {
            tokenId,
            tokenURI,
            creators: creators([minterAddress]),
            royalties: [],
            signatures: [zeroWord],
          },
          transferToAddress,
        ),
    ).to.be.revertedWith("not owner or minter");
    await token.connect(tokenOwner).addMinter(minterAddress);
    expect(await token.isMinter(minterAddress)).to.be.true;
    expect(await token.isMinter(transferToAddress)).to.be.false;
    await token
      .connect(minter)
      .mintAndTransfer(
        {
          tokenId,
          tokenURI,
          creators: creators([minterAddress]),
          royalties: [],
          signatures: [zeroWord],
        },
        transferToAddress,
      );
    expect(await token.ownerOf(tokenId)).to.equal(transferToAddress);
  });
  it("mint and transfer with minter access control and minter signature", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();
    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";
    const royalties: Part[] = [];
    const signature = await getSignature(tokenId, tokenURI, creators([minterAddress]), royalties, minter);
    await expect(
      token
        .connect(minter)
        .mintAndTransfer(
          {
            tokenId,
            tokenURI,
            creators: creators([minterAddress]),
            royalties,
            signatures: [signature],
          },
          transferToAddress,
        ),
    ).to.be.revertedWith("not owner or minter");
    await token.connect(tokenOwner).addMinter(minterAddress);
    expect(await token.isMinter(minterAddress)).to.be.true;
    await token
      .connect(minter)
      .mintAndTransfer(
        {
          tokenId,
          tokenURI,
          creators: creators([minterAddress]),
          royalties,
          signatures: [signature],
        },
        transferToAddress,
      );
    expect(await token.ownerOf(tokenId)).to.equal(transferToAddress);
  });
  it("mint and transfer with minter access control and wrong minter signature", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const minterAddress = await minter.getAddress();
    const transferToAddress = await transferTo.getAddress();
    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";
    const royalties: Part[] = [];
    const signature = await getSignature(tokenId, tokenURI, creators([minterAddress]), royalties, transferTo);
    await expect(
      token
        .connect(minter)
        .mintAndTransfer(
          {
            tokenId,
            tokenURI,
            creators: creators([minterAddress]),
            royalties,
            signatures: [signature],
          },
          transferToAddress,
        ),
    ).to.be.revertedWith("not owner or minter");
    await token.connect(tokenOwner).addMinter(minterAddress);
    expect(await token.isMinter(minterAddress)).to.be.true;
    await expect(
      token
        .connect(minter)
        .mintAndTransfer(
          {
            tokenId,
            tokenURI,
            creators: creators([minterAddress]),
            royalties,
            signatures: [signature],
          },
          transferToAddress,
        ),
    ).to.be.revertedWith("signature verification error");
  });
});