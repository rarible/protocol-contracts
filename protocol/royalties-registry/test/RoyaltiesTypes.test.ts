// <ai_context> Test suite for royalties types in RoyaltiesRegistry. Covers type setting, changing, and edge cases for different royalty providers and methods. Ported from Truffle to Hardhat with TypeChain. Updated for manual proxy deployment in upgrade tests using OpenZeppelin transparent proxy. </ai_context>
import { expect } from "chai";
import type { BaseContract, Contract } from "ethers";
import { network } from "hardhat";
const connection = await network.connect();
const { ethers } = connection;

import {
  type RoyaltiesRegistry,
  RoyaltiesRegistry__factory,
  type TestERC721WithRoyaltiesV1OwnableUpgradeable,
  TestERC721WithRoyaltiesV1OwnableUpgradeable__factory,
  type TestERC721WithRoyaltiesV2OwnableUpgradeable,
  TestERC721WithRoyaltiesV2OwnableUpgradeable__factory,
  type RoyaltiesProviderTest,
  RoyaltiesProviderTest__factory,
  type TestERC721WithRoyaltyV2981,
  TestERC721WithRoyaltyV2981__factory,
  type RoyaltiesRegistryOld,
  RoyaltiesRegistryOld__factory,
  ProxyAdmin__factory, type ProxyAdmin,
  type TestERC721,
} from "../types/ethers-contracts";

// import { upgrades } from "hardhat";
type DeployTransparentProxyParams<T extends BaseContract> = {
  contractName: string;
  initFunction?: string;
  initArgs?: unknown[];
  proxyOwner?: string;
  implementationArgs?: unknown[];
  contractAtName?: string;
};

type DeployTransparentProxyResult<T extends BaseContract> = {
  proxyAdmin: ProxyAdmin;
  implementation: Contract;
  proxy: Contract;
  instance: T;
};

async function deployTransparentProxy<T extends BaseContract>({
  contractName,
  initFunction,
  initArgs = [],
  proxyOwner,
  implementationArgs = [],
  contractAtName,
}: DeployTransparentProxyParams<T>): Promise<DeployTransparentProxyResult<T>> {
  const [defaultSigner] = await ethers.getSigners();
  const ownerAddress = proxyOwner ?? (await defaultSigner.getAddress());

  // 1. Deploy implementation
  const implementation = await ethers.deployContract(contractName, implementationArgs);
  await implementation.waitForDeployment();

  // 2. Encode optional initializer
  const initData =
    initFunction != null
      ? implementation.interface.encodeFunctionData(initFunction, initArgs)
      : "0x";

  // 3. Deploy TransparentUpgradeableProxy
  const TransparentProxy = await ethers.getContractFactory("TransparentUpgradeableProxy");
  const proxy = await TransparentProxy.deploy(
    await implementation.getAddress(),
    ownerAddress, // ✅ initialOwner for the internally created ProxyAdmin
    initData,
  );
  await proxy.waitForDeployment();

  // 4. Find the ProxyAdmin address from the AdminChanged event
  const deployTx = proxy.deploymentTransaction();
  if (!deployTx) {
    throw new Error("Proxy deployment transaction not found");
  }

  const receipt = await deployTx.wait();
  const iface = TransparentProxy.interface;

  let proxyAdminAddress: string | null = null;
  for (const log of receipt?.logs ?? []) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === "AdminChanged") {
        // event AdminChanged(address previousAdmin, address newAdmin)
        proxyAdminAddress = parsed.args[1] as string;
        break;
      }
    } catch {
      // Not an AdminChanged log for this contract, ignore
    }
  }

  if (!proxyAdminAddress) {
    throw new Error("ProxyAdmin address not found in AdminChanged event");
  }

  // 5. Connect to the internally created ProxyAdmin
  const proxyAdmin = ProxyAdmin__factory.connect(proxyAdminAddress, defaultSigner);

  // 6. Get typed instance at proxy address
  const instance = (await ethers.getContractAt(
    contractAtName ?? contractName,
    await proxy.getAddress(),
  )) as unknown as T;

  return {
    proxyAdmin,
    implementation,
    proxy,
    instance,
  };
}



describe("RoyaltiesRegistry, royalties types test", function () {
  let royaltiesRegistry: RoyaltiesRegistry;
  let royaltiesAddr1: string;
  let royaltiesAddr2: string;
  let ownerErc721: string;
  let defaultRoyalties: any[]; //LibPart.PartStruct[];
  let defaultTokenId1 = 533n;
  let defaultTokenId2 = 644n;
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  before(async function () {
    const [_, __, ___, ____, _____, acc5, acc6, acc7] = await ethers.getSigners();
    royaltiesAddr1 = acc5.address;
    royaltiesAddr2 = acc6.address;
    ownerErc721 = acc7.address;
    defaultRoyalties = [
      { account: royaltiesAddr1, value: 1000n },
      { account: royaltiesAddr2, value: 500n },
    ];
  });
  beforeEach(async function () {
    const [deployer] = await ethers.getSigners();
    royaltiesRegistry = await new RoyaltiesRegistry__factory(deployer).deploy();
    await royaltiesRegistry.waitForDeployment();
    await royaltiesRegistry.__RoyaltiesRegistry_init();
  });
  describe("royalties types are set correctly", () => {
    it("test royalties type = 1, royalties set in royaltiesByToken", async function () {
      const token = await royaltiesRegistry.getAddress();
      await royaltiesRegistry.setRoyaltiesByToken(token, defaultRoyalties);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(1n, "setRoyaltiesByToken type = 1");
      await royaltiesRegistry.clearRoyaltiesType(token);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(0n, "correct royalties type");
      const tx1 = await royaltiesRegistry.getRoyalties(token, defaultTokenId1);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(1n, "correct royalties type");
      console.log("royaltiesByToken gas used first request", (await tx1.wait())?.gasUsed.toString());
      const tx2 = await royaltiesRegistry.getRoyalties(token, defaultTokenId2);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(1n, "correct royalties type");
      console.log("royaltiesByToken gas used second request", (await tx2.wait())?.gasUsed.toString());
    });
    it("test royalties type = 2, royalties v2", async function () {
      const [, __, acc2, ____, _____, acc5, acc6, acc7] = await ethers.getSigners();
      const ERC721_V2OwnUpgrd = await new TestERC721WithRoyaltiesV2OwnableUpgradeable__factory(acc7).deploy();
      await ERC721_V2OwnUpgrd.waitForDeployment();
      await ERC721_V2OwnUpgrd.connect(acc7).initialize();
      await ERC721_V2OwnUpgrd.connect(acc7).mint(acc2.address, defaultTokenId1, defaultRoyalties);
      await ERC721_V2OwnUpgrd.connect(acc7).mint(acc2.address, defaultTokenId2, defaultRoyalties);
      const tx1 = await royaltiesRegistry.getRoyalties(await ERC721_V2OwnUpgrd.getAddress(), defaultTokenId1);
      expect(await royaltiesRegistry.getRoyaltiesType(await ERC721_V2OwnUpgrd.getAddress())).to.equal(
        2n,
        "correct royalties type",
      );
      console.log("royalties v2 gas used first request", (await tx1.wait())?.gasUsed.toString());
      const tx2 = await royaltiesRegistry.getRoyalties(await ERC721_V2OwnUpgrd.getAddress(), defaultTokenId2);
      expect(await royaltiesRegistry.getRoyaltiesType(await ERC721_V2OwnUpgrd.getAddress())).to.equal(
        2n,
        "correct royalties type",
      );
      console.log("royalties v2 gas used second request", (await tx2.wait())?.gasUsed.toString());
    });
    it("test royalties type = 3, royalties v1", async function () {
      const [_, __, acc2, ____, _____, acc5, acc6, acc7] = await ethers.getSigners();
      const ERC721_V1OwnUpgrd = await new TestERC721WithRoyaltiesV1OwnableUpgradeable__factory(acc7).deploy();
      await ERC721_V1OwnUpgrd.waitForDeployment();
      await ERC721_V1OwnUpgrd.connect(acc7).initialize();
      await ERC721_V1OwnUpgrd.connect(acc7).mint(acc2.address, defaultTokenId1, defaultRoyalties);
      await ERC721_V1OwnUpgrd.connect(acc7).mint(acc2.address, defaultTokenId2, defaultRoyalties);
      const tx1 = await royaltiesRegistry.getRoyalties(await ERC721_V1OwnUpgrd.getAddress(), defaultTokenId1);
      expect(await royaltiesRegistry.getRoyaltiesType(await ERC721_V1OwnUpgrd.getAddress())).to.equal(
        3n,
        "correct royalties type",
      );
      console.log("royalties v1 gas used first request", (await tx1.wait())?.gasUsed.toString());
      const tx2 = await royaltiesRegistry.getRoyalties(await ERC721_V1OwnUpgrd.getAddress(), defaultTokenId2);
      expect(await royaltiesRegistry.getRoyaltiesType(await ERC721_V1OwnUpgrd.getAddress())).to.equal(
        3n,
        "correct royalties type",
      );
      console.log("royalties v1 gas used second request", (await tx2.wait())?.gasUsed.toString());
    });
    it("test royalties type = 4, royalties from external provider", async function () {
      const token = await royaltiesRegistry.getAddress();
      const testRoyaltiesProvider = await new RoyaltiesProviderTest__factory(
        await (
          await ethers.getSigners()
        )[0],
      ).deploy();
      await testRoyaltiesProvider.waitForDeployment();
      await testRoyaltiesProvider.initializeProvider(token, defaultTokenId1, defaultRoyalties);
      await testRoyaltiesProvider.initializeProvider(token, defaultTokenId2, defaultRoyalties);
      await royaltiesRegistry.setProviderByToken(token, await testRoyaltiesProvider.getAddress());
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(4n, "external provider type = 4");
      await royaltiesRegistry.clearRoyaltiesType(token);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(0n, "correct royalties type");
      const tx1 = await royaltiesRegistry.getRoyalties(token, defaultTokenId1);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(4n, "correct royalties type");
      console.log("external provider gas used first request", (await tx1.wait())?.gasUsed.toString());
      const tx2 = await royaltiesRegistry.getRoyalties(token, defaultTokenId2);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(4n, "correct royalties type");
      console.log("external provider gas used second request", (await tx2.wait())?.gasUsed.toString());
    });
    it("test royalties type = 5, royalties 2981", async function () {
      const [_, acc1, acc2, ____, _____, acc5, acc6, acc7] = await ethers.getSigners();
      const tokenId1 = (BigInt(await acc1.getAddress()) << 96n) | 1n;
      const tokenId2 = (BigInt(await acc2.getAddress()) << 96n) | 2n;
      const ERC721_V2981 = await new TestERC721WithRoyaltyV2981__factory(acc7).deploy();
      await ERC721_V2981.waitForDeployment();
      await ERC721_V2981.connect(acc7).initialize();
      const tx1 = await royaltiesRegistry.getRoyalties(await ERC721_V2981.getAddress(), tokenId1);
      expect(await royaltiesRegistry.getRoyaltiesType(await ERC721_V2981.getAddress())).to.equal(
        5n,
        "correct royalties type",
      );
      console.log("royalties 2981 gas used first request", (await tx1.wait())?.gasUsed.toString());
      const tx2 = await royaltiesRegistry.getRoyalties(await ERC721_V2981.getAddress(), tokenId2);
      expect(await royaltiesRegistry.getRoyaltiesType(await ERC721_V2981.getAddress())).to.equal(
        5n,
        "correct royalties type",
      );
      console.log("royalties 2981 gas used second request", (await tx2.wait())?.gasUsed.toString());
    });
    it("test royalties type = 6, no royalties contract", async function () {
      const token = await royaltiesRegistry.getAddress();
      await royaltiesRegistry.getRoyalties(token, defaultTokenId1);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(6n, "type 6 ");
      expect((await royaltiesRegistry.getRoyalties.staticCall(token, defaultTokenId1)).length).to.equal(
        0,
        "royalties 0",
      );
    });
    it("should change royalties types correctly", async function () {
      const token = await royaltiesRegistry.getAddress();
      //firstly type = 6, no royalties
      await royaltiesRegistry.getRoyalties(token, defaultTokenId1);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(6n, "type 6 ");
      expect((await royaltiesRegistry.getRoyalties.staticCall(token, defaultTokenId1)).length).to.equal(
        0,
        "royalties 0",
      );
      const testRoyaltiesProvider = await new RoyaltiesProviderTest__factory(
        await (
          await ethers.getSigners()
        )[0],
      ).deploy();
      await testRoyaltiesProvider.waitForDeployment();
      await testRoyaltiesProvider.initializeProvider(token, defaultTokenId1, defaultRoyalties);
      await testRoyaltiesProvider.initializeProvider(token, defaultTokenId2, defaultRoyalties);
      // then we set external provider, now type is 4
      await royaltiesRegistry.setProviderByToken(token, await testRoyaltiesProvider.getAddress());
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(4n, "external provider type = 4");
      // then we use setRoyaltiesByToken
      await royaltiesRegistry.setRoyaltiesByToken(token, defaultRoyalties);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(1n, "setRoyaltiesByToken type = 1");
      // finally clear type
      await royaltiesRegistry.clearRoyaltiesType(token);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(0n, "correct royalties type");
    });
    it("royalties types correctly work with zero address", async function () {
      expect(await royaltiesRegistry.getRoyaltiesType(ZERO_ADDRESS)).to.equal(0n, "unset royalties type = 0");
    });
  });
  describe("royalties types set correctly from external methods", () => {
    it("setRoyaltiesByToken sets royalties type = 1", async function () {
      const [_, __, ___, acc3] = await ethers.getSigners();
      const token = acc3.address;
      await royaltiesRegistry.setRoyaltiesByToken(token, defaultRoyalties);
      expect(await royaltiesRegistry.getProvider(token)).to.equal(ZERO_ADDRESS, "provider is not set");
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(1n, "setRoyaltiesByToken type = 1");
      //forceSetRoyaltiesType = 3
      await royaltiesRegistry.forceSetRoyaltiesType(token, 3n);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(3n, "forceSetRoyaltiesType 3");
      expect(await royaltiesRegistry.getProvider(token)).to.equal(ZERO_ADDRESS, "provider is not set");
      //clearRoyaltiesType
      await royaltiesRegistry.clearRoyaltiesType(token);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(0n, "correct royalties type");
      expect(await royaltiesRegistry.getProvider(token)).to.equal(ZERO_ADDRESS, "provider is not set");
    });
    it("setProvider sets royalties type = 4, forceSetRoyaltiesType = 3, clearRoyaltiesType", async function () {
      const [, __, ___, acc3, acc4] = await ethers.getSigners();
      const token = acc3.address;
      const provider = acc4.address;
      await royaltiesRegistry.setProviderByToken(token, provider);
      expect(await royaltiesRegistry.getProvider(token)).to.equal(provider, "setProviderByToken works");
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(4n, "external provider type = 4");
      //forceSetRoyaltiesType = 3
      await royaltiesRegistry.forceSetRoyaltiesType(token, 3n);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(3n, "forceSetRoyaltiesType 3");
      expect(await royaltiesRegistry.getProvider(token)).to.equal(provider, "provider is set");
      //clearRoyaltiesType
      await royaltiesRegistry.clearRoyaltiesType(token);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(0n, "clearRoyaltiesType ");
      expect(await royaltiesRegistry.getProvider(token)).to.equal(provider, "provider is set");
    });
    it("forceSetRoyaltiesType + clearRoyaltiesType", async function () {
      const [, __, ___, acc3] = await ethers.getSigners();
      const token = acc3.address;
      //forceSetRoyaltiesType not from owner
      await expect(royaltiesRegistry.connect(acc3).forceSetRoyaltiesType(token, 1n)).to.be.revertedWith(
        "Token owner not detected",
      );
      //can't set royalties type to 0
      await expect(royaltiesRegistry.forceSetRoyaltiesType(token, 0n)).to.be.rejectedWith("wrong royaltiesType");
      //forceSetRoyaltiesType from 1 to 6 works
      for (let i = 1n; i <= 6n; i++) {
        await royaltiesRegistry.forceSetRoyaltiesType(token, i);
        expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(i, "forceSetRoyaltiesType " + i);
        expect(await royaltiesRegistry.getProvider(token)).to.equal(ZERO_ADDRESS, "provider is not set");
      }
      //can't set royalties type to 7, max value is 6
      await expect(royaltiesRegistry.forceSetRoyaltiesType(token, 7n)).to.be.rejectedWith("wrong royaltiesType");
      //only owner can clear royalties
      await expect(royaltiesRegistry.connect(acc3).clearRoyaltiesType(token)).to.be.rejectedWith(
        "Token owner not detected",
      );
      //clearRoyaltiesType
      await royaltiesRegistry.clearRoyaltiesType(token);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(0n, "clearRoyaltiesType ");
      expect(await royaltiesRegistry.getProvider(token)).to.equal(ZERO_ADDRESS, "provider is not set");
    });
  });
  describe("upgrade checks", () => {
    it("check storage after upgrade", async function () {
      const [ownerSigner, acc1] = await ethers.getSigners();
      const owner = await ownerSigner.getAddress();
      const { proxyAdmin, proxy, instance: royaltiesRegistryOld } =
        await deployTransparentProxy<RoyaltiesRegistryOld>({
          contractName: "RoyaltiesRegistryOld",
          initFunction: "__RoyaltiesRegistry_init",
          initArgs: [],
          proxyOwner: owner,
        });
      // then set data
      const { instance: token } = await deployTransparentProxy<TestERC721>({
        contractName: "TestERC721",
        initFunction: "initialize",
        initArgs: ["Test", "TST"],
        proxyOwner: owner,
      });
      const tokenAddr = await token.getAddress();
      const { instance: token2 } = await deployTransparentProxy<TestERC721>({
        contractName: "TestERC721",
        initFunction: "initialize",
        initArgs: ["Test", "TST"],
        proxyOwner: owner,
      });
      const token2Addr = await token2.getAddress();
      const { instance: token3 } = await deployTransparentProxy<TestERC721>({
        contractName: "TestERC721",
        initFunction: "initialize",
        initArgs: ["Test", "TST"],
        proxyOwner: owner,
      });
      const token3Addr = await token3.getAddress();
      const tokenId3 = 11234n;
      //setRoyaltiesByTokenAndTokenId
      await royaltiesRegistryOld.setRoyaltiesByTokenAndTokenId(tokenAddr, tokenId3, [{ account: owner, value: 1000n }]);
      //setRoyaltiesByToken
      await royaltiesRegistryOld.setRoyaltiesByToken(token2Addr, [{ account: await acc1.getAddress(), value: 900n }]);
      //external provider
      const testRoyaltiesProvider = await ethers.deployContract("RoyaltiesProviderTest");
      await testRoyaltiesProvider.initializeProvider(token3Addr, defaultTokenId1, [[owner, 800n]]);
      await royaltiesRegistryOld.setProviderByToken(token3Addr, await testRoyaltiesProvider.getAddress());
      const royaltiesFromToken = await royaltiesRegistryOld.getRoyalties.staticCall(token2Addr, tokenId3);
      const royaltiesFromProvider = await royaltiesRegistryOld.getRoyalties.staticCall(token3Addr, defaultTokenId1);
      // deploy new impl
      const newImpl = await ethers.deployContract("RoyaltiesRegistry");
      // upgrade (call read-only function to satisfy OZ 5.x upgradeAndCall requirement)
      const noopCallData = newImpl.interface.encodeFunctionData("owner", []);
      console.log("proxyAdmin owner: ", await proxyAdmin.owner());

      await proxyAdmin.upgradeAndCall(await proxy.getAddress(), await newImpl.getAddress(), noopCallData);
      // get as new
      const royaltiesRegistry = (await ethers.getContractAt(
        "RoyaltiesRegistry",
        await proxy.getAddress(),
      )) as any as RoyaltiesRegistry;
      expect(await royaltiesRegistry.getRoyaltiesType(token2Addr)).to.equal(0n, "");
      expect(await royaltiesRegistry.getRoyaltiesType(token3Addr)).to.equal(0n, "");
      expect((await royaltiesRegistry.getRoyalties.staticCall(tokenAddr, tokenId3)).length).to.equal(
        0,
        "royaltiesFromTokenAndTokenId",
      );
      expect((await royaltiesRegistry.getRoyalties.staticCall(token2Addr, tokenId3))[0].account).to.equal(
        royaltiesFromToken[0].account,
        "royaltiesFromToken",
      );
      expect((await royaltiesRegistry.getRoyalties.staticCall(token2Addr, tokenId3))[0].value).to.equal(
        royaltiesFromToken[0].value,
        "royaltiesFromToken",
      );
      expect((await royaltiesRegistry.getRoyalties.staticCall(token3Addr, defaultTokenId1))[0].account).to.equal(
        royaltiesFromProvider[0].account,
        "royaltiesFromProvider",
      );
      expect((await royaltiesRegistry.getRoyalties.staticCall(token3Addr, defaultTokenId1))[0].value).to.equal(
        royaltiesFromProvider[0].value,
        "royaltiesFromProvider",
      );
      await royaltiesRegistry.getRoyalties(tokenAddr, tokenId3);
      await royaltiesRegistry.getRoyalties(token2Addr, tokenId3);
      await royaltiesRegistry.getRoyalties(token3Addr, defaultTokenId1);
      expect(await royaltiesRegistry.getRoyaltiesType(token2Addr)).to.equal(1n, "royaltiesFromToken type 1");
      expect(await royaltiesRegistry.getRoyaltiesType(token3Addr)).to.equal(4n, "external provider type 4");
    });
  });
});