import { expect } from "chai";
import { network } from "hardhat";
import type * as ethersTypes from "ethers";
const connection = await network.connect();
const { ethers } = connection;
import {
  Mint721ValidatorTest__factory,
  type Mint721ValidatorTest,
  TestERC1271__factory,
  type TestERC1271,
} from "../../types/ethers-contracts";
import { sign as signMint721 } from "@rarible/common-sdk/src/mint721";
type Part = { account: string; value: bigint };
import { deployTransparentProxy } from "@rarible/common-sdk/src/deploy";

const ZERO_SIGNATURE = "0x";
describe("Mint721Validator", function () {
  let validator: Mint721ValidatorTest;
  let erc1271: TestERC1271;
  let accounts: ethersTypes.Signer[];
  before(async () => {
    accounts = await ethers.getSigners();
    const [deployer] = accounts as [ethersTypes.Signer, ...ethersTypes.Signer[]];
    validator = await new Mint721ValidatorTest__factory(deployer).deploy();
    await validator.waitForDeployment();
    const { instance } = await deployTransparentProxy<Mint721ValidatorTest>(ethers, {
      contractName: "Mint721ValidatorTest",
      initFunction: "__Mint721ValidatorTest_init",
      initArgs: [],
      proxyOwner: await deployer.getAddress(),
    });
    validator = instance;
    erc1271 = await new TestERC1271__factory(deployer).deploy();
    await erc1271.waitForDeployment();
  });
  async function buildSignature(
    signer: ethersTypes.Signer,
    tokenId: bigint,
    tokenURI: string,
    creators: Part[],
    royalties: Part[],
  ) {
    return signMint721(signer, tokenId, tokenURI, creators, royalties, await validator.getAddress());
  }
  function part(account: string, value: number | bigint): Part {
    return { account, value: BigInt(value) };
  }
  it("validates when signature matches signer", async () => {
    const tokenId = 1n;
    const tokenURI = "testURI";
    const signer = accounts[1];
    const signerAddress = await signer.getAddress();
    const creators = [part(signerAddress, 10000n)];
    const royalties = [part(await accounts[1].getAddress(), 1n), part(await accounts[2].getAddress(), 100n)];
    const signature = await buildSignature(signer, tokenId, tokenURI, creators, royalties);
    await expect(
      validator.validateTest(
        {
          tokenId,
          tokenURI,
          creators,
          royalties,
          signatures: [signature],
        },
        0,
      ),
    ).to.not.be.revertedWith("signature verification error");
  });
  it("validates when signature is provided for indexed creator", async () => {
    const tokenId = 1n;
    const tokenURI = "testURI";
    const signer = accounts[1];
    const signerAddress = await signer.getAddress();
    const otherCreatorAddress = await accounts[2].getAddress();
    const creators = [part(otherCreatorAddress, 5000n), part(signerAddress, 10000n)];
    const royalties = [part(await accounts[3].getAddress(), 1n), part(await accounts[4].getAddress(), 100n)];
    const signature = await buildSignature(signer, tokenId, tokenURI, creators, royalties);
    await expect(
      validator.validateTest(
        {
          tokenId,
          tokenURI,
          creators,
          royalties,
          signatures: [ZERO_SIGNATURE, signature],
        },
        1,
      ),
    ).to.not.be.revertedWith("signature verification error");
  });
  it("validates when royalties array is empty", async () => {
    const tokenId = 1n;
    const tokenURI = "testURI";
    const signer = accounts[1];
    const signerAddress = await signer.getAddress();
    const creators = [part(signerAddress, 10000n)];
    const royalties: Part[] = [];
    const signature = await buildSignature(signer, tokenId, tokenURI, creators, royalties);
    await expect(
      validator.validateTest(
        {
          tokenId,
          tokenURI,
          creators,
          royalties,
          signatures: [signature],
        },
        0,
      ),
    ).to.not.be.revertedWith("signature verification error");
  });
  it("reverts when signature does not match creator", async () => {
    const tokenId = 1n;
    const tokenURI = "testURI";
    const signer = accounts[0];
    const expectedCreator = await accounts[1].getAddress();
    const creators = [part(expectedCreator, 10000n)];
    const royalties = [part(await accounts[2].getAddress(), 1n), part(await accounts[3].getAddress(), 100n)];
    const signature = await buildSignature(signer, tokenId, tokenURI, creators, royalties);
    await expect(
      validator.validateTest(
        {
          tokenId,
          tokenURI,
          creators,
          royalties,
          signatures: [signature],
        },
        0,
      ),
    ).to.be.revertedWith("signature verification error");
  });
  it("validates ERC1271 contract signatures", async () => {
    const tokenId = 1n;
    const tokenURI = "testURI";
    const creatorAddress = await erc1271.getAddress();
    const creators = [part(creatorAddress, 10000n)];
    const royalties = [part(await accounts[1].getAddress(), 1n), part(await accounts[2].getAddress(), 100n)];
    await expect(
      validator.validateTest(
        {
          tokenId,
          tokenURI,
          creators,
          royalties,
          signatures: [ZERO_SIGNATURE],
        },
        0,
      ),
    ).to.be.revertedWith("signature verification error");
    await erc1271.setReturnSuccessfulValidSignature(true);
    await expect(
      validator.validateTest(
        {
          tokenId,
          tokenURI,
          creators,
          royalties,
          signatures: [ZERO_SIGNATURE],
        },
        0,
      ),
    ).to.not.be.revertedWith("signature verification error");
  });
});
