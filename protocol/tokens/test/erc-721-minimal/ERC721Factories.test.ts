import { expect } from "chai";
import { network } from "hardhat";
import type * as ethersTypes from "ethers";
const connection = await network.connect();
const { ethers } = connection;
import {
  type UpgradeableBeacon,
  UpgradeableBeacon__factory,
  type ERC721RaribleMinimal,
  ERC721RaribleMinimal__factory,
  type ERC721RaribleFactoryC2,
  ERC721RaribleFactoryC2__factory,
} from "../../types/ethers-contracts";

const zeroWord = "0x0000000000000000000000000000000000000000000000000000000000000000";
const ZERO = "0x0000000000000000000000000000000000000000";
type Part = { account: string; value: bigint };
function creators(accounts: string[]): Part[] {
  const value = BigInt(10000 / accounts.length);
  return accounts.map((account) => ({ account, value }));
}
describe("ERC721Factories", function () {
  let tokenOwner: ethersTypes.Signer;
  let factory: ERC721RaribleFactoryC2;
  let beacon: UpgradeableBeacon;
  let accounts: ethersTypes.Signer[];
  let deployer: ethersTypes.Signer;
  const salt = 3n;
  before(async () => {
    accounts = await ethers.getSigners();
    [deployer, tokenOwner] = accounts as [ethersTypes.Signer, ethersTypes.Signer, ...ethersTypes.Signer[]];
    // Deploy implementation
    const impl = await new ERC721RaribleMinimal__factory(deployer).deploy();
    await impl.waitForDeployment();
    // Deploy beacon
    beacon = await new UpgradeableBeacon__factory(deployer).deploy(await impl.getAddress(), await tokenOwner.getAddress());
    await beacon.waitForDeployment();
    // Deploy factory with zero proxies
    factory = await new ERC721RaribleFactoryC2__factory(deployer).deploy(
      await beacon.getAddress(),
      ZERO,
      ZERO,
    );
    await factory.waitForDeployment();
  });
//   string memory _name,
//   string memory _symbol,
//   string memory baseURI,
//   string memory contractURI,
//   address initialOwner,
//   uint _salt
  it("should create erc721 private from factory, getAddress works correctly", async () => {
    let proxyAddress: string | undefined;
    const addressBeforeDeploy = await factory["getAddress(string,string,string,string,address[],address,uint256)"](
      "name",
      "RARI",
      "https://ipfs.rarible.com",
      "https://ipfs.rarible.com",
      [],
      await tokenOwner.getAddress(),
      salt,
    );
    const tx = await factory
      .connect(tokenOwner)
      ["createToken(string,string,string,string,address[],uint256)"](
        "name",
        "RARI",
        "https://ipfs.rarible.com",
        "https://ipfs.rarible.com",
        [],
        salt,
      );
    const receipt = await tx.wait();
    // Find Create721RaribleUserProxy event
    for (const log of receipt?.logs ?? []) {
      try {
        const parsed = factory.interface.parseLog(log);
        if (parsed?.name === "Create721RaribleUserProxy") {
          proxyAddress = parsed.args.proxy as string;
          break;
        }
      } catch {
        // ignore
      }
    }
    if (!proxyAddress) {
      throw new Error("Create721RaribleUserProxy event not found");
    }
    expect(proxyAddress).to.equal(addressBeforeDeploy);
    const tokenByProxy = ERC721RaribleMinimal__factory.connect(proxyAddress, deployer);
    const minter = tokenOwner;
    const minterAddress = await minter.getAddress();
    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";
    const txMint = await tokenByProxy
      .connect(minter)
      .mintAndTransfer(
        { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
        await accounts[2].getAddress(),
      );
    await txMint.wait();
    expect(await tokenByProxy.ownerOf(tokenId)).to.equal(await accounts[2].getAddress());
    expect(await tokenByProxy.name()).to.equal("name");
    await tokenByProxy
      .connect(accounts[2])
      .transferFrom(await accounts[2].getAddress(), minterAddress, tokenId);
  });
  it("test check don`t add operators while create token create erc721 private from factory, getAddress works correctly", async () => {
    let proxyAddress: string | undefined;
    const operator1 = accounts[7];
    const operator1Address = await operator1.getAddress();
    const tx = await factory
      .connect(tokenOwner)
      ["createToken(string,string,string,string,address[],uint256)"](
        "name",
        "RARI2",
        "https://ipfs.rarible.com",
        "https://ipfs.rarible.com",
        [operator1Address],
        salt,
      );
    const receipt = await tx.wait();
    for (const log of receipt?.logs ?? []) {
      try {
        const parsed = factory.interface.parseLog(log);
        if (parsed?.name === "Create721RaribleUserProxy") {
          proxyAddress = parsed.args.proxy as string;
          break;
        }
      } catch {
        // ignore
      }
    }
    if (!proxyAddress) {
      throw new Error("Create721RaribleUserProxy event not found");
    }
    const tokenByProxy = ERC721RaribleMinimal__factory.connect(proxyAddress, deployer);
    const factoryAddress = await factory.getAddress();
    const tokenOwnerAddress = await tokenOwner.getAddress();
    expect(await tokenByProxy.isApprovedForAll(factoryAddress, operator1Address)).to.equal(false);
    expect(await tokenByProxy.isApprovedForAll(tokenOwnerAddress, operator1Address)).to.equal(false);
    await tokenByProxy.connect(tokenOwner).setApprovalForAll(operator1Address, true);
    // only after tokenOwner call isApprovedForAll to operator1, operator1 is approved
    expect(await tokenByProxy.isApprovedForAll(tokenOwnerAddress, operator1Address)).to.equal(true);
  });
  it("should create erc721 public from factory, getAddress works correctly", async () => {
    let proxyAddress: string | undefined;
    const addressBeforeDeploy = await factory["getAddress(string,string,string,string,address,uint256)"](
      "name",
      "RARI",
      "https://ipfs.rarible.com",
      "https://ipfs.rarible.com",
      await tokenOwner.getAddress(),
      salt,
    );
    const tx = await factory
      .connect(tokenOwner)
      ["createToken(string,string,string,string,uint256)"](
        "name",
        "RARI",
        "https://ipfs.rarible.com",
        "https://ipfs.rarible.com",
        salt,
      );
    const receipt = await tx.wait();
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
    expect(proxyAddress).to.equal(addressBeforeDeploy);
    const tokenByProxy = ERC721RaribleMinimal__factory.connect(proxyAddress, deployer);
    const minter = tokenOwner;
    const minterAddress = await minter.getAddress();
    const tokenId = minterAddress + "b00000000000000000000001";
    const tokenURI = "//uri";
    const txMint = await tokenByProxy
      .connect(minter)
      .mintAndTransfer(
        { tokenId, tokenURI, creators: creators([minterAddress]), royalties: [], signatures: [zeroWord] },
        await accounts[2].getAddress(),
      );
    await txMint.wait();
    expect(await tokenByProxy.ownerOf(tokenId)).to.equal(await accounts[2].getAddress());
    expect(await tokenByProxy.name()).to.equal("name");
    await tokenByProxy
      .connect(accounts[2])
      .transferFrom(await accounts[2].getAddress(), minterAddress, tokenId);
  });
});