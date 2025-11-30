import { expect } from "chai";
import { network } from "hardhat";
import type * as ethersTypes from "ethers";
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

const connection = await network.connect();
const { ethers } = connection;

// Inline helpers from src/assets.ts and src/order.ts
function id(str: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(str)).slice(0, 10);
}

function encodeAddress(address: string): string {
  const hex = address.toLowerCase().replace(/^0x/, "");
  if (hex.length !== 40) {
    throw new Error(`Invalid address length for ${address}`);
  }
  return hex.padStart(64, "0");
}

function encodeUint256(value: bigint | number | string): string {
  const bn = BigInt(value);
  if (bn < 0n) {
    throw new Error("Uint256 cannot be negative");
  }
  const hex = bn.toString(16);
  if (hex.length > 64) {
    throw new Error("Uint256 value too large");
  }
  return hex.padStart(64, "0");
}

function enc(token: string, tokenId?: bigint | number | string): string {
  const addrWord = encodeAddress(token);
  if (tokenId === undefined) {
    return `0x${addrWord}`;
  }
  const idWord = encodeUint256(tokenId);
  return `0x${addrWord}${idWord}`;
}

type AssetTypeStruct = {
  assetClass: string;
  data: string;
};

type AssetStruct = {
  assetType: AssetTypeStruct;
  value: bigint;
};

type OrderStruct = {
  maker: string;
  makeAsset: AssetStruct;
  taker: string;
  takeAsset: AssetStruct;
  salt: bigint;
  start: bigint;
  end: bigint;
  dataType: string;
  data: string;
};

function AssetType(assetClass: string, data: string): AssetTypeStruct {
  return { assetClass, data };
}

function Asset(assetClass: string, assetData: string, value: bigint | number | string): AssetStruct {
  return {
    assetType: AssetType(assetClass, assetData),
    value: BigInt(value),
  };
}

function Order(
  maker: string,
  makeAsset: AssetStruct,
  taker: string,
  takeAsset: AssetStruct,
  salt: bigint | number | string,
  start: bigint | number | string,
  end: bigint | number | string,
  dataType: string,
  data: string,
): OrderStruct {
  return {
    maker,
    makeAsset,
    taker,
    takeAsset,
    salt: BigInt(salt),
    start: BigInt(start),
    end: BigInt(end),
    dataType,
    data,
  };
}

const Types: Record<string, Array<{ name: string; type: string }>> = {
  AssetType: [
    { name: "assetClass", type: "bytes4" },
    { name: "data", type: "bytes" },
  ],
  Asset: [
    { name: "assetType", type: "AssetType" },
    { name: "value", type: "uint256" },
  ],
  Order: [
    { name: "maker", type: "address" },
    { name: "makeAsset", type: "Asset" },
    { name: "taker", type: "address" },
    { name: "takeAsset", type: "Asset" },
    { name: "salt", type: "uint256" },
    { name: "start", type: "uint256" },
    { name: "end", type: "uint256" },
    { name: "dataType", type: "bytes4" },
    { name: "data", type: "bytes" },
  ],
};

async function sign(signer: ethersTypes.Signer, order: OrderStruct, verifyingContract: string): Promise<string> {
  const networkInfo = await signer.provider?.getNetwork();
  const chainId = networkInfo?.chainId ?? 1; // Default to 1 as in original JS
  const domain = {
    name: "Mint721",
    version: "1",
    chainId,
    verifyingContract,
  };
  return signer.signTypedData(domain as any, Types as any, order as any);
}

describe("ERC721Rarible", function () {
  let token: ERC721Rarible;
  let tokenOwner: ethersTypes.Signer;
  let erc1271: TestERC1271;
  let beacon: UpgradeableBeacon;
  let factory: ERC721RaribleFactoryC2;
  let proxyLazy: ERC721LazyMintTransferProxyTest;
  let transferProxy: TransferProxyTest;
  let testRoyaltyV2981Calculate: TestRoyaltyV2981Calculate;
  let accounts: ethersTypes.Signer[];
  let deployer: ethersTypes.Signer;
  let whiteListProxy: ethersTypes.Signer;
  const name = 'FreeMintableRarible';
  const zeroWord = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const ZERO = "0x0000000000000000000000000000000000000000";

  function creators(list: string[]) {
    const value = 10000n / BigInt(list.length);
    return list.map(account => ({ account, value }));
  }

  function fees(list: string[]) {
    const value = 500n;
    return list.map(account => ({ account, value }));
  }

  function feesWithZero(list: string[]) {
    const value = 0n;
    return list.map(account => ({ account, value }));
  }

  async function getSignature(tokenId: string, tokenURI: string, creatorsList: any[], feesList: any[], account: ethersTypes.Signer | string) {
    const addr = typeof account === 'string' ? account : await account.getAddress();
    return sign(typeof account === 'string' ? deployer : account, Order(
      addr,
      Asset(id("ERC721_LAZY"), "0x", 1n),
      ZERO,
      Asset(id("ETH"), "0x", 0n),
      0n,
      0n,
      0n,
      id("V1"),
      "0x"
    ), await token.getAddress());
  }

  async function checkCreators(tokenId: string | bigint, exp: string[]) {
    const res = await token.getCreators(tokenId);
    expect(res.length).to.equal(exp.length);
    const value = 10000n / BigInt(exp.length);
    for (let i = 0; i < res.length; i++) {
      expect(res[i].account).to.equal(exp[i]);
      expect(res[i].value).to.equal(value);
    }
  }

  before(async function () {
    accounts = await ethers.getSigners();
    [deployer, tokenOwner, whiteListProxy] = accounts as [ethersTypes.Signer, ethersTypes.Signer, ethersTypes.Signer, ...ethersTypes.Signer[]];

    proxyLazy = await new ERC721LazyMintTransferProxyTest__factory(deployer).deploy();
    await proxyLazy.waitForDeployment();

    transferProxy = await new TransferProxyTest__factory(deployer).deploy();
    await transferProxy.waitForDeployment();

    erc1271 = await new TestERC1271__factory(deployer).deploy();
    await erc1271.waitForDeployment();

    testRoyaltyV2981Calculate = await new TestRoyaltyV2981Calculate__factory(deployer).deploy();
    await testRoyaltyV2981Calculate.waitForDeployment();
  });

  beforeEach(async function () {
    token = await new ERC721Rarible__factory(deployer).deploy();
    await token.waitForDeployment();
    await token.__ERC721Rarible_init(
      name,
      "RARI",
      "https://ipfs.rarible.com",
      "https://ipfs.rarible.com",
      await whiteListProxy.getAddress(),
      await proxyLazy.getAddress(),
      await tokenOwner.getAddress()
    );
  });

  describe("Burn before ERC721Rarible ()", () => {
    it("Run burn from minter, mintAndTransfer by the same minter not possible, token burned, throw", async () => {
      const minter = accounts[1];
      const transferTo = accounts[4];
      const tokenId = BigInt((await minter.getAddress()).slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
      const tokenURI = "//uri";

      await token.connect(minter).burn(tokenId);

      await expect(token.connect(minter).mintAndTransfer([tokenId, tokenURI, creators([(await minter.getAddress())]), [], [zeroWord]], await transferTo.getAddress())).to.be.reverted;
    });

    it("Run burn from another, throw, mintAndTransfer by the same minter is possible", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const tokenId = BigInt((await minter.getAddress()).slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
      const tokenURI = "//uri";

      await expect(token.connect(transferTo).burn(tokenId)).to.be.reverted;

      await token.connect(minter).mintAndTransfer([tokenId, tokenURI, creators([(await minter.getAddress())]), [], [zeroWord]], await transferTo.getAddress());

      expect(await token.ownerOf(tokenId)).to.equal(await transferTo.getAddress());
    });
  });

  describe("Burn after ERC721Rarible ()", () => {
    it("Run mintAndTransfer, burn, mintAndTransfer by the same minter, throw", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const transferTo2 = accounts[4];
      const tokenId = BigInt((await minter.getAddress()).slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
      const tokenURI = "//uri";

      await token.connect(minter).mintAndTransfer([tokenId, tokenURI, creators([(await minter.getAddress())]), [], [zeroWord]], await transferTo.getAddress());

      await token.connect(transferTo).burn(tokenId);

      await expect(token.connect(minter).mintAndTransfer([tokenId, tokenURI, creators([(await minter.getAddress())]), [], [zeroWord]], await transferTo2.getAddress())).to.be.reverted;
    });

    it("Run transferFromOrMint, burn, transferFromOrMint by the same minter, throw", async () => {
      const minter = accounts[1];
      const transferTo = accounts[2];
      const tokenId = BigInt((await minter.getAddress()).slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
      const tokenURI = "//uri";

      await token.connect(minter).transferFromOrMint([tokenId, tokenURI, creators([(await minter.getAddress())]), [], [zeroWord]], await minter.getAddress(), await transferTo.getAddress());

      expect(await token.ownerOf(tokenId)).to.equal(await transferTo.getAddress());

      await token.connect(transferTo).burn(tokenId);

      await expect(token.connect(minter).transferFromOrMint([tokenId, tokenURI, creators([(await minter.getAddress())]), [], [zeroWord]], await minter.getAddress(), await transferTo.getAddress())).to.be.reverted;
    });
  });

  it("mint and transfer by minter, and token created by ERC721Factory ", async () => {
    beacon = await new UpgradeableBeacon__factory(deployer).deploy(await token.getAddress(), await deployer.getAddress());
    await beacon.waitForDeployment();

    factory = await new ERC721RaribleFactoryC2__factory(deployer).deploy(await beacon.getAddress(), await transferProxy.getAddress(), await proxyLazy.getAddress());
    await factory.waitForDeployment();

    const tx = await factory.createToken("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", 1n, { from: await tokenOwner.getAddress() });

    let proxyAddress: string | undefined;
    const receipt = await tx.wait();
    for (const log of receipt.logs) {
      if (log.fragment?.name === "Create721RaribleProxy") {
        proxyAddress = log.args.proxy;
      }
    }
    if (!proxyAddress) throw new Error("No proxy event emitted");

    const tokenByProxy = ERC721Rarible__factory.connect(proxyAddress, deployer);

    const minter = tokenOwner;
    const minterAddr = await minter.getAddress();
    const tokenId = BigInt(minterAddr.slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = "//uri";

    await tokenByProxy.connect(minter).mintAndTransfer([tokenId, tokenURI, creators([minterAddr]), [], [zeroWord]], minterAddr);

    expect(await tokenByProxy.ownerOf(tokenId)).to.equal(minterAddr);
  });

  it("checkPrefix should work correctly, checks for duplicating of the base part of the uri ", async () => {
    beacon = await new UpgradeableBeacon__factory(deployer).deploy(await token.getAddress(), await deployer.getAddress());
    await beacon.waitForDeployment();

    factory = await new ERC721RaribleFactoryC2__factory(deployer).deploy(await beacon.getAddress(), await transferProxy.getAddress(), await proxyLazy.getAddress());
    await factory.waitForDeployment();

    const baseURI = "https://ipfs.rarible.com";
    const tx = await factory["createToken(string,string,string,string,uint256)"]("name", "RARI", baseURI, "https://ipfs.rarible.com", 1n, { from: await tokenOwner.getAddress() });

    let proxyAddress: string | undefined;
    const receipt = await tx.wait();
    for (const log of receipt?.logs ?? []) {
      if (log.fragment?.name === "Create721RaribleProxy") {
        proxyAddress = log.args.proxy;
      }
    }
    if (!proxyAddress) throw new Error("No proxy event emitted");

    const tokenByProxy = ERC721Rarible__factory.connect(proxyAddress, deployer);

    const minter = tokenOwner;
    const minterAddr = await minter.getAddress();
    const tokenId = BigInt(minterAddr.slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = baseURI + "/12345/456";

    await tokenByProxy.connect(minter).mintAndTransfer([{ data: { tokenId, tokenURI, creators: creators([minterAddr]), fees: [], signatures: [zeroWord] } }, minterAddr]);

    expect(await tokenByProxy.tokenURI(tokenId)).to.equal(tokenURI);

    const tokenId1 = BigInt(minterAddr.slice(2).padStart(40, "0") + "b00000000000000000000002", 16);
    const tokenURI1 = "/12345/123512512/12312312";

    await tokenByProxy.connect(minter).mintAndTransfer([tokenId1, tokenURI1, creators([minterAddr]), [], [zeroWord]], minterAddr);

    expect(await tokenByProxy.tokenURI(tokenId1)).to.equal(baseURI + tokenURI1);

    const tokenId2 = BigInt(minterAddr.slice(2).padStart(40, "0") + "b00000000000000000000003", 16);
    const tokenURI2 = "/12345/";

    await tokenByProxy.connect(minter).mintAndTransfer([tokenId2, tokenURI2, creators([minterAddr]), [], [zeroWord]], minterAddr);

    expect(await tokenByProxy.tokenURI(tokenId2)).to.equal(baseURI + tokenURI2);
  });

  it("check for ERC165 interface", async () => {
    expect(await token.supportsInterface("0x01ffc9a7")).to.be.true;
  });

  it("check for mintAndTransfer interface", async () => {
    expect(await token.supportsInterface("0x8486f69f")).to.be.true;
  });

  it("check for RoayltiesV2 interface", async () => {
    expect(await token.supportsInterface("0xcad96cca")).to.be.true;
  });

  it("check for support IERC2981 interface", async () => {
    expect(await token.supportsInterface("0x2a55205a")).to.be.true;
  });

  it("check for ERC721 interfaces", async () => {
    expect(await token.supportsInterface("0x80ac58cd")).to.be.true;
    expect(await token.supportsInterface("0x5b5e139f")).to.be.true;
    expect(await token.supportsInterface("0x780e9d63")).to.be.true;
  });

  it("approve for all", async () => {
    expect(await token.isApprovedForAll(await accounts[1].getAddress(), await whiteListProxy.getAddress())).to.be.true;
    expect(await token.isApprovedForAll(await accounts[1].getAddress(), await proxyLazy.getAddress())).to.be.true;
  });

  it("set new BaseUri, check only owner, check emit event", async () => {
    const oldBaseUri = await token.baseURI();
    const newBaseUriSet = "https://ipfs.rarible-the-best-in-the-World.com";

    await expect(token.setBaseURI(newBaseUriSet)).to.be.revertedWith("Ownable: caller is not the owner");

    const tx = await token.connect(tokenOwner).setBaseURI(newBaseUriSet);

    const newBaseUri = await token.baseURI();
    expect(newBaseUri).to.equal(newBaseUriSet);
    expect(newBaseUri).to.not.equal(oldBaseUri);

    await expect(tx).to.emit(token, "BaseUriChanged").withArgs(newBaseUriSet);
  });

  it("check Royalties IERC2981, with 3 royaltiesBeneficiary ", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const royaltiesBeneficiary1 = accounts[3];
    const royaltiesBeneficiary2 = accounts[4];
    const royaltiesBeneficiary3 = accounts[6];
    const WEIGHT_PRICE = 1000000n;
    const tokenId = BigInt((await minter.getAddress()).slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = "//uri";

    const sig = await getSignature(tokenId, tokenURI, creators([(await minter.getAddress())]), fees([(await royaltiesBeneficiary1.getAddress()), (await royaltiesBeneficiary2.getAddress()), (await royaltiesBeneficiary3.getAddress())]), minter);

    await token.connect(whiteListProxy).mintAndTransfer([tokenId, tokenURI, creators([(await minter.getAddress())]), fees([(await royaltiesBeneficiary1.getAddress()), (await royaltiesBeneficiary2.getAddress()), (await royaltiesBeneficiary3.getAddress())]), [sig]], await transferTo.getAddress());

    const [receiver, amount] = await token.royaltyInfo(tokenId, WEIGHT_PRICE);
    expect(receiver).to.equal(await royaltiesBeneficiary1.getAddress());
    expect(amount).to.equal(150000n);

    const royaltiesPart = await testRoyaltyV2981Calculate.calculateRoyaltiesTest(receiver, amount);
    expect(royaltiesPart.length).to.equal(1);
    expect(royaltiesPart[0].account).to.equal(await royaltiesBeneficiary1.getAddress());
    expect(royaltiesPart[0].value).to.equal(1500n);
  });

  it("check Royalties IERC2981, with 3 royaltiesBeneficiary zero fee, throw ", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const royaltiesBeneficiary1 = accounts[3];
    const royaltiesBeneficiary2 = accounts[4];
    const royaltiesBeneficiary3 = accounts[6];
    const tokenId = BigInt((await minter.getAddress()).slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = "//uri";

    const sig = await getSignature(tokenId, tokenURI, creators([(await minter.getAddress())]), feesWithZero([(await royaltiesBeneficiary1.getAddress()), (await royaltiesBeneficiary2.getAddress()), (await royaltiesBeneficiary3.getAddress())]), minter);

    await expect(
      token.connect(whiteListProxy).mintAndTransfer([tokenId, tokenURI, creators([(await minter.getAddress())]), feesWithZero([(await royaltiesBeneficiary1.getAddress()), (await royaltiesBeneficiary2.getAddress()), (await royaltiesBeneficiary3.getAddress())]), [sig]], await transferTo.getAddress())
    ).to.be.reverted;
  });

  it("check Royalties IERC2981, with only 1 royaltiesBeneficiary ", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const royaltiesBeneficiary1 = accounts[3];
    const WEIGHT_PRICE = 1000000n;
    const tokenId = BigInt((await minter.getAddress()).slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = "//uri";

    const sig = await getSignature(tokenId, tokenURI, creators([(await minter.getAddress())]), fees([(await royaltiesBeneficiary1.getAddress())]), minter);

    await token.connect(whiteListProxy).mintAndTransfer([tokenId, tokenURI, creators([(await minter.getAddress())]), fees([(await royaltiesBeneficiary1.getAddress())]), [sig]], await transferTo.getAddress());

    const [receiver, amount] = await token.royaltyInfo(tokenId, WEIGHT_PRICE);
    expect(receiver).to.equal(await royaltiesBeneficiary1.getAddress());
    expect(amount).to.equal(50000n);

    const royaltiesPart = await testRoyaltyV2981Calculate.calculateRoyaltiesTest(receiver, amount);
    expect(royaltiesPart.length).to.equal(1);
    expect(royaltiesPart[0].account).to.equal(await royaltiesBeneficiary1.getAddress());
    expect(royaltiesPart[0].value).to.equal(500n);
  });

  it("check Royalties IERC2981, with only 0 royaltiesBeneficiary ", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const WEIGHT_PRICE = 1000000n;
    const tokenId = BigInt((await minter.getAddress()).slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = "//uri";

    const sig = await getSignature(tokenId, tokenURI, creators([(await minter.getAddress())]), fees([]), minter);

    await token.connect(whiteListProxy).mintAndTransfer([tokenId, tokenURI, creators([(await minter.getAddress())]), fees([]), [sig]], await transferTo.getAddress());

    const [receiver, amount] = await token.royaltyInfo(tokenId, WEIGHT_PRICE);
    expect(receiver).to.equal(ZERO);
    expect(amount).to.equal(0n);

    const royaltiesPart = await testRoyaltyV2981Calculate.calculateRoyaltiesTest(receiver, amount);
    expect(royaltiesPart.length).to.equal(0);
  });

  it("mint and transfer by whitelist proxy", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const minterAddr = await minter.getAddress();
    const tokenId = BigInt(minterAddr.slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = "//uri";
    const feesList: any[] = [];

    const sig = await getSignature(tokenId, tokenURI, creators([minterAddr]), feesList, minter);

    const tx = await token.connect(whiteListProxy).mintAndTransfer([tokenId, tokenURI, creators([minterAddr]), feesList, [sig]], await transferTo.getAddress());

    await expect(tx).to.emit(token, "Transfer").withArgs(ZERO, minterAddr, tokenId);
    await expect(tx).to.emit(token, "Transfer").withArgs(minterAddr, await transferTo.getAddress(), tokenId);

    expect(await token.ownerOf(tokenId)).to.equal(await transferTo.getAddress());

    await checkCreators(tokenId, [minterAddr]);
  });

  it("mint and transfer by whitelist proxy. several creators", async () => {
    const minter = accounts[1];
    const creator2 = accounts[3];
    const transferTo = accounts[2];
    const minterAddr = await minter.getAddress();
    const creator2Addr = await creator2.getAddress();
    const tokenId = BigInt(minterAddr.slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = "//uri";
    const feesList: any[] = [];

    const sig1 = await getSignature(tokenId, tokenURI, creators([minterAddr, creator2Addr]), feesList, minter);
    const sig2 = await getSignature(tokenId, tokenURI, creators([minterAddr, creator2Addr]), feesList, creator2);

    await token.connect(whiteListProxy).mintAndTransfer([tokenId, tokenURI, creators([minterAddr, creator2Addr]), feesList, [sig1, sig2]], await transferTo.getAddress());

    expect(await token.ownerOf(tokenId)).to.equal(await transferTo.getAddress());

    await checkCreators(tokenId, [minterAddr, creator2Addr]);
  });

  it("mint and transfer by whitelist proxy. several creators. minter is not first", async () => {
    const minter = accounts[1];
    const creator2 = accounts[3];
    const transferTo = accounts[2];
    const minterAddr = await minter.getAddress();
    const creator2Addr = await creator2.getAddress();
    const tokenId = BigInt(minterAddr.slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = "//uri";
    const feesList: any[] = [];

    const sig1 = await getSignature(tokenId, tokenURI, creators([creator2Addr, minterAddr]), feesList, minter);
    const sig2 = await getSignature(tokenId, tokenURI, creators([creator2Addr, minterAddr]), feesList, creator2);

    await expect(
      token.connect(whiteListProxy).mintAndTransfer([tokenId, tokenURI, creators([creator2Addr, minterAddr]), feesList, [sig2, sig1]], await transferTo.getAddress())
    ).to.be.reverted;
  });

  it("mint and transfer by whitelist proxy. several creators. wrong order of signatures", async () => {
    const minter = accounts[1];
    const creator2 = accounts[3];
    const transferTo = accounts[2];
    const minterAddr = await minter.getAddress();
    const creator2Addr = await creator2.getAddress();
    const tokenId = BigInt(minterAddr.slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = "//uri";
    const feesList: any[] = [];

    const sig1 = await getSignature(tokenId, tokenURI, creators([minterAddr, creator2Addr]), feesList, minter);
    const sig2 = await getSignature(tokenId, tokenURI, creators([minterAddr, creator2Addr]), feesList, creator2);

    await expect(
      token.connect(whiteListProxy).mintAndTransfer([tokenId, tokenURI, creators([minterAddr, creator2Addr]), feesList, [sig2, sig1]], await transferTo.getAddress())
    ).to.be.reverted;
  });

  it("mint and transfer by approved proxy for all", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const minterAddr = await minter.getAddress();
    const tokenId = BigInt(minterAddr.slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = "//uri";

    const sig = await getSignature(tokenId, tokenURI, creators([minterAddr]), [], minter);

    const proxy = accounts[5];
    await token.connect(minter).setApprovalForAll(await proxy.getAddress(), true);

    const tx = await token.connect(proxy).mintAndTransfer([tokenId, tokenURI, creators([minterAddr]), [], [sig]], await transferTo.getAddress());

    expect(await token.ownerOf(tokenId)).to.equal(await transferTo.getAddress());
  });

  it("mint and transfer by approved proxy for tokenId", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const minterAddr = await minter.getAddress();
    const tokenId = BigInt(minterAddr.slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = "//uri";

    await expect(token.connect(minter).approve(await accounts[5].getAddress(), tokenId)).to.be.revertedWith("ERC721: approved query for nonexistent token");
  });

  it("mint and transfer by minter", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const minterAddr = await minter.getAddress();
    const tokenId = BigInt(minterAddr.slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = "//uri";

    await token.connect(minter).mintAndTransfer([tokenId, tokenURI, creators([minterAddr]), [], [zeroWord]], await transferTo.getAddress());

    expect(await token.ownerOf(tokenId)).to.equal(await transferTo.getAddress());
  });

  it("transferFromOrMint from minter. not yet minted", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const minterAddr = await minter.getAddress();
    const tokenId = BigInt(minterAddr.slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = "//uri";

    await token.connect(minter).transferFromOrMint([tokenId, tokenURI, creators([minterAddr]), [], [zeroWord]], minterAddr, await transferTo.getAddress());

    expect(await token.ownerOf(tokenId)).to.equal(await transferTo.getAddress());
  });

  it("transferFromOrMint from minter. already minted", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const minterAddr = await minter.getAddress();
    const tokenId = BigInt(minterAddr.slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = "//uri";

    await token.connect(minter).mintAndTransfer([tokenId, tokenURI, creators([minterAddr]), [], [zeroWord]], minterAddr);

    await token.connect(minter).transferFromOrMint([tokenId, tokenURI, creators([minterAddr]), [], [zeroWord]], minterAddr, await transferTo.getAddress());

    await expect(token.connect(minter).transferFromOrMint([tokenId, tokenURI, creators([minterAddr]), [], [zeroWord]], minterAddr, await transferTo.getAddress())).to.be.reverted;

    expect(await token.ownerOf(tokenId)).to.equal(await transferTo.getAddress());
  });

  it("transferFromOrMint when not minter. not yet minted", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const minterAddr = await minter.getAddress();
    const tokenId = BigInt(minterAddr.slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = "//uri";

    await expect(token.connect(transferTo).transferFromOrMint([tokenId, tokenURI, creators([minterAddr]), [], [zeroWord]], minterAddr, await transferTo.getAddress())).to.be.reverted;

    await token.connect(minter).transferFromOrMint([tokenId, tokenURI, creators([minterAddr]), [], [zeroWord]], minterAddr, await transferTo.getAddress());

    await token.connect(transferTo).transferFromOrMint([tokenId, tokenURI, creators([minterAddr]), [], [zeroWord]], await transferTo.getAddress(), await accounts[5].getAddress());

    expect(await token.ownerOf(tokenId)).to.equal(await accounts[5].getAddress());
  });

  it("mint and transfer to self by minter", async () => {
    const minter = accounts[1];
    const minterAddr = await minter.getAddress();
    const tokenId = BigInt(minterAddr.slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = "//uri";

    await token.connect(minter).mintAndTransfer([tokenId, tokenURI, creators([minterAddr]), [], [zeroWord]], minterAddr);

    expect(await token.ownerOf(tokenId)).to.equal(minterAddr);
  });

  it("mint and transfer with signature of not minter", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const minterAddr = await minter.getAddress();
    const tokenId = BigInt(minterAddr.slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = "//uri";

    const sig = await getSignature(tokenId, tokenURI, creators([minterAddr]), [], transferTo);

    await expect(token.connect(whiteListProxy).mintAndTransfer([tokenId, tokenURI, creators([minterAddr]), [], [sig]], await transferTo.getAddress())).to.be.reverted;
  });

  it("mint and transfer without approval", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];
    const minterAddr = await minter.getAddress();
    const tokenId = BigInt(minterAddr.slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = "//uri";

    const sig = await getSignature(tokenId, tokenURI, creators([minterAddr]), [], minter);

    await expect(token.connect(accounts[3]).mintAndTransfer([tokenId, tokenURI, creators([minterAddr]), [], [sig]], await transferTo.getAddress())).to.be.reverted;
  });

  it("standard transfer from owner", async () => {
    const minter = accounts[1];
    const minterAddr = await minter.getAddress();
    const tokenId = BigInt(minterAddr.slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = "//uri";

    await token.connect(minter).mintAndTransfer([tokenId, tokenURI, creators([minterAddr]), [], [zeroWord]], minterAddr);

    expect(await token.ownerOf(tokenId)).to.equal(minterAddr);

    const transferTo = accounts[2];

    await token.connect(minter).transferFrom(minterAddr, await transferTo.getAddress(), tokenId);

    expect(await token.ownerOf(tokenId)).to.equal(await transferTo.getAddress());
  });

  it("standard transfer by approved contract", async () => {
    const minter = accounts[1];
    const minterAddr = await minter.getAddress();
    const tokenId = BigInt(minterAddr.slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = "//uri";

    await token.connect(minter).mintAndTransfer([tokenId, tokenURI, creators([minterAddr]), [], [zeroWord]], minterAddr);

    expect(await token.ownerOf(tokenId)).to.equal(minterAddr);

    const transferTo = accounts[2];

    await token.connect(whiteListProxy).transferFrom(minterAddr, await transferTo.getAddress(), tokenId);

    expect(await token.ownerOf(tokenId)).to.equal(await transferTo.getAddress());
  });

  it("standard transfer by not approved contract", async () => {
    const minter = accounts[1];
    const minterAddr = await minter.getAddress();
    const tokenId = BigInt(minterAddr.slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = "//uri";

    await token.connect(minter).mintAndTransfer([tokenId, tokenURI, creators([minterAddr]), [], [zeroWord]], minterAddr);

    expect(await token.ownerOf(tokenId)).to.equal(minterAddr);

    const transferTo = accounts[2];

    await expect(token.connect(accounts[8]).transferFrom(minterAddr, await transferTo.getAddress(), tokenId)).to.be.reverted;
  });

  it("signature by contract wallet erc1271, with whitelist proxy", async () => {
    const minterAddr = await erc1271.getAddress();
    const transferTo = accounts[2];
    const tokenId = BigInt(minterAddr.slice(2).padStart(40, "0") + "b00000000000000000000001", 16);
    const tokenURI = "//uri";

    await expect(token.connect(whiteListProxy).mintAndTransfer([tokenId, tokenURI, creators([minterAddr]), [], [zeroWord]], await transferTo.getAddress())).to.be.reverted;

    await erc1271.setReturnSuccessfulValidSignature(true);

    await token.connect(whiteListProxy).mintAndTransfer([tokenId, tokenURI, creators([minterAddr]), [], [zeroWord]], await transferTo.getAddress());

    expect(await token.ownerOf(tokenId)).to.equal(await transferTo.getAddress());
  });
});