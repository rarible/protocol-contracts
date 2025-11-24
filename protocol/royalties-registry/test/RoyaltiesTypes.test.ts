// <ai_context> Test suite for royalties types in RoyaltiesRegistry. Covers type setting, changing, and edge cases for different royalty providers and methods. Ported from Truffle to Hardhat with TypeChain. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
const connection = await network.connect();
const { ethers } = connection;
import { upgrades } from "hardhat";
import { type RoyaltiesRegistry, RoyaltiesRegistry__factory, 
  type TestERC721WithRoyaltiesV1OwnableUpgradeable, 
  TestERC721WithRoyaltiesV1OwnableUpgradeable__factory, 
  type TestERC721WithRoyaltiesV2OwnableUpgradeable, 
  TestERC721WithRoyaltiesV2OwnableUpgradeable__factory, 
  type RoyaltiesProviderTest, RoyaltiesProviderTest__factory, 
  type TestERC721WithRoyaltyV2981, TestERC721WithRoyaltyV2981__factory, type RoyaltiesRegistryOld, RoyaltiesRegistryOld__factory } from "../types/ethers-contracts";
import { type TestERC721, TestERC721__factory } from "../types/ethers-contracts";
import { LibPart } from "../types/ethers-contracts/contracts/providers/RoyaltiesProviderArtBlocksV2";
describe("RoyaltiesRegistry, royalties types test", function () {
  let royaltiesRegistry: RoyaltiesRegistry;
  let royaltiesAddr1: string;
  let royaltiesAddr2: string;
  let ownerErc721: string;
  let defaultRoyalties: LibPart.PartStruct[];
  let defaultTokenId1 = 533n;
  let defaultTokenId2 = 644n;
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  before(async function () {
    const [_, __, ___, ____, _____, acc5, acc6, acc7] = await ethers.getSigners();
    royaltiesAddr1 = acc5.address;
    royaltiesAddr2 = acc6.address;
    ownerErc721 = acc7.address;
    defaultRoyalties = [{ account: royaltiesAddr1, value: 1000n }, { account: royaltiesAddr2, value: 500n }];
  });
  beforeEach(async function () {
    royaltiesRegistry = await upgrades.deployProxy(new RoyaltiesRegistry__factory(), [], { initializer: '__RoyaltiesRegistry_init' }) as RoyaltiesRegistry;
  });
  describe("royalties types are set correctly", () => {
    it("test royalties type = 1, royalties set in royaltiesByToken", async function () {
      const token = await royaltiesRegistry.getAddress();
      await royaltiesRegistry.setRoyaltiesByToken(token, defaultRoyalties)
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(1n, "setRoyaltiesByToken type = 1")
      await royaltiesRegistry.clearRoyaltiesType(token);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(0n, "correct royalties type")
      const tx1 = await royaltiesRegistry.getRoyalties(token, defaultTokenId1);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(1n, "correct royalties type")
      console.log("royaltiesByToken gas used first request", (await tx1.wait()).gasUsed.toString())
      const tx2 = await royaltiesRegistry.getRoyalties(token, defaultTokenId2);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(1n, "correct royalties type")
      console.log("royaltiesByToken gas used second request", (await tx2.wait()).gasUsed.toString())
    })
    it("test royalties type = 2, royalties v2", async function () {
      const [_, __, acc2, ____, _____, acc5, acc6, acc7] = await ethers.getSigners();
      
      const ERC721_V2OwnUpgrd = await new TestERC721WithRoyaltiesV2OwnableUpgradeable__factory(acc7).deploy("Rarible", "RARI", "https://ipfs.rarible.com");
      await ERC721_V2OwnUpgrd.connect(acc7).initialize(); 
      await ERC721_V2OwnUpgrd.connect(acc7).mint(acc2.address, defaultTokenId1, defaultRoyalties);
      await ERC721_V2OwnUpgrd.connect(acc7).mint(acc2.address, defaultTokenId2, defaultRoyalties);
      const tx1 = await royaltiesRegistry.getRoyalties(await ERC721_V2OwnUpgrd.getAddress(), defaultTokenId1);
      expect(await royaltiesRegistry.getRoyaltiesType(await ERC721_V2OwnUpgrd.getAddress())).to.equal(2n, "correct royalties type")
      console.log("royalties v2 gas used first request", (await tx1.wait())?.gasUsed.toString())
      const tx2 = await royaltiesRegistry.getRoyalties(await ERC721_V2OwnUpgrd.getAddress(), defaultTokenId2);
      expect(await royaltiesRegistry.getRoyaltiesType(await ERC721_V2OwnUpgrd.getAddress())).to.equal(2n, "correct royalties type")
      console.log("royalties v2 gas used second request", (await tx2.wait())?.gasUsed.toString())
    })
    it("test royalties type = 3, royalties v1", async function () {
      const [_, __, acc2, ____, _____, acc5, acc6, acc7] = await ethers.getSigners();
      const ERC721_V1OwnUpgrd = await new TestERC721WithRoyaltiesV1OwnableUpgradeable__factory(acc7).deploy("Rarible", "RARI", "https://ipfs.rarible.com");
      await ERC721_V1OwnUpgrd.connect(acc7).initialize(); 
      await ERC721_V1OwnUpgrd.connect(acc7).mint(acc2.address, defaultTokenId1, defaultRoyalties);
      await ERC721_V1OwnUpgrd.connect(acc7).mint(acc2.address, defaultTokenId2, defaultRoyalties);
      const tx1 = await royaltiesRegistry.getRoyalties(await ERC721_V1OwnUpgrd.getAddress(), defaultTokenId1);
      expect(await royaltiesRegistry.getRoyaltiesType(await ERC721_V1OwnUpgrd.getAddress())).to.equal(3n, "correct royalties type")
      console.log("royalties v1 gas used first request", (await tx1.wait())?.gasUsed.toString())
      const tx2 = await royaltiesRegistry.getRoyalties(await ERC721_V1OwnUpgrd.getAddress(), defaultTokenId2);
      expect(await royaltiesRegistry.getRoyaltiesType(await ERC721_V1OwnUpgrd.getAddress())).to.equal(3n, "correct royalties type")
      console.log("royalties v1 gas used second request", (await tx2.wait())?.gasUsed.toString())
    })
    it("test royalties type = 4, royalties from external provider", async function () {
      const token = await royaltiesRegistry.getAddress();
      const testRoyaltiesProvider = await new RoyaltiesProviderTest__factory().deploy();
      await testRoyaltiesProvider.initializeProvider(token, defaultTokenId1, defaultRoyalties);
      await testRoyaltiesProvider.initializeProvider(token, defaultTokenId2, defaultRoyalties);
      await royaltiesRegistry.setProviderByToken(token, await testRoyaltiesProvider.getAddress())
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(4n, "external provider type = 4")
      await royaltiesRegistry.clearRoyaltiesType(token);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(0n, "correct royalties type")
      const tx1 = await royaltiesRegistry.getRoyalties(token, defaultTokenId1);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(4n, "correct royalties type")
      console.log("external provider gas used first request", (await tx1.wait())?.gasUsed.toString())
      const tx2 = await royaltiesRegistry.getRoyalties(token, defaultTokenId2);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(4n, "correct royalties type")
      console.log("external provider gas used second request", (await tx2.wait())?.gasUsed.toString())
    })
    it("test royalties type = 5, royalties 2981", async function () {
      const [_, __, acc2, ____, _____, acc5, acc6, acc7] = await ethers.getSigners();
      const tokenId1 = BigInt(await acc2.getAddress()) << 96n | 1n;
      const tokenId2 = BigInt(await acc2.getAddress()) << 96n | 2n;
      const ERC721_V2981 = await new TestERC721WithRoyaltyV2981__factory(acc7).deploy("Rarible", "RARI", "https://ipfs.rarible.com");
      await ERC721_V2981.connect(acc7).initialize(); 
      const tx1 = await royaltiesRegistry.getRoyalties(await ERC721_V2981.getAddress(), tokenId1);
      expect(await royaltiesRegistry.getRoyaltiesType(await ERC721_V2981.getAddress())).to.equal(5n, "correct royalties type")
      console.log("royalties 2981 gas used first request", (await tx1.wait())?.gasUsed.toString())
      const tx2 = await royaltiesRegistry.getRoyalties(await ERC721_V2981.getAddress(), tokenId2);
      expect(await royaltiesRegistry.getRoyaltiesType(await ERC721_V2981.getAddress())).to.equal(5n, "correct royalties type")
      console.log("royalties 2981 gas used second request", (await tx2.wait())?.gasUsed.toString())
    })
    it("test royalties type = 6, no royalties contract", async function () {
      const token = await royaltiesRegistry.getAddress();
      await royaltiesRegistry.getRoyalties(token, defaultTokenId1)
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(6n, "type 6 ")
      expect((await royaltiesRegistry.getRoyalties.staticCall(token, defaultTokenId1)).length).to.equal(0, "royalties 0")
    })
    it("test royalties type = 6, no royalties contract", async function () {
      const token = await royaltiesRegistry.getAddress();
      await royaltiesRegistry.getRoyalties(token, defaultTokenId1)
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(6n, "type 6 ")
      expect((await royaltiesRegistry.getRoyalties.staticCall(token, defaultTokenId1))?.length).to.equal(0, "royalties 0")
    })
    it("test royalties type change correctly", async function () {
      const token = await royaltiesRegistry.getAddress();
      //firstly type = 6, no royalties
      await royaltiesRegistry.getRoyalties(token, defaultTokenId1)
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(6n, "type 6 ")
      expect((await royaltiesRegistry.getRoyalties.staticCall(token, defaultTokenId1)).length).to.equal(0, "royalties 0")
      const testRoyaltiesProvider = await new RoyaltiesProviderTest__factory().deploy();
      await testRoyaltiesProvider.initializeProvider(token, defaultTokenId1, defaultRoyalties);
      await testRoyaltiesProvider.initializeProvider(token, defaultTokenId2, defaultRoyalties);
      // then we set external provider, now type is 4
      await royaltiesRegistry.setProviderByToken(token, await testRoyaltiesProvider.getAddress())
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(4n, "external provider type = 4")
      // then we use setRoyaltiesByToken
      await royaltiesRegistry.setRoyaltiesByToken(token, defaultRoyalties)
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(1n, "setRoyaltiesByToken type = 1")
      // finally clear type
      await royaltiesRegistry.clearRoyaltiesType(token);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(0n, "correct royalties type")
    })
    it("royalties types correctly work with zero address", async function () {
      expect(await royaltiesRegistry.getRoyaltiesType(ZERO_ADDRESS)).to.equal(0n, "unset royalties type = 0")
    })
  })
  describe("royalties types set correctly from external methods", () => {
    it("setRoyaltiesByToken sets royalties type = 1", async function () {
      const [_, __, ___, acc3] = await ethers.getSigners();
      const token = acc3.address;
      await royaltiesRegistry.setRoyaltiesByToken(token, defaultRoyalties)
      expect(await royaltiesRegistry.getProvider(token)).to.equal(ZERO_ADDRESS, "provider is not set")
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(1n, "setRoyaltiesByToken type = 1")
      //forceSetRoyaltiesType = 3
      await royaltiesRegistry.forceSetRoyaltiesType(token, 3n);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(3n, "forceSetRoyaltiesType 3")
      expect(await royaltiesRegistry.getProvider(token)).to.equal(ZERO_ADDRESS, "provider is not set")
      //clearRoyaltiesType
      await royaltiesRegistry.clearRoyaltiesType(token);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(0n, "correct royalties type")
      expect(await royaltiesRegistry.getProvider(token)).to.equal(ZERO_ADDRESS, "provider is not set")
    })
    it("setProvider sets royalties type = 4, forceSetRoyaltiesType = 3, clearRoyaltiesType", async function () {
      const [_, __, ___, acc3, acc4] = await ethers.getSigners();
      const token = acc3.address;
      const provider = acc4.address
      await royaltiesRegistry.setProviderByToken(token, provider)
      expect(await royaltiesRegistry.getProvider(token)).to.equal(provider, "setProviderByToken works")
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(4n, "external provider type = 4")
      //forceSetRoyaltiesType = 3
      await royaltiesRegistry.forceSetRoyaltiesType(token, 3n);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(3n, "forceSetRoyaltiesType 3")
      expect(await royaltiesRegistry.getProvider(token)).to.equal(provider, "provider is set")
      //clearRoyaltiesType
      await royaltiesRegistry.clearRoyaltiesType(token);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(0n, "clearRoyaltiesType ")
      expect(await royaltiesRegistry.getProvider(token)).to.equal(provider, "provider is set")
    })
    it("forceSetRoyaltiesType + clearRoyaltiesType", async function () {
      const [_, __, ___, acc3] = await ethers.getSigners();
      const token = acc3.address
      //forceSetRoyaltiesType not from owner
      await expect(royaltiesRegistry.connect(acc3).forceSetRoyaltiesType(token, 1n)).to.be.revertedWith("Token owner not detected");
      //can't set royalties type to 0
      await expect(royaltiesRegistry.forceSetRoyaltiesType(token, 0n)).to.be.revertedWith("wrong royaltiesType");
      //forceSetRoyaltiesType from 1 to 5 works
      for (let i = 1n; i <= 6n; i++) {
        await royaltiesRegistry.forceSetRoyaltiesType(token, i);
        expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(i, "forceSetRoyaltiesType " + i)
        expect(await royaltiesRegistry.getProvider(token)).to.equal(ZERO_ADDRESS, "provider is not set")
      }
      //can't set royalties type to 7, max value is 6
      await expect(royaltiesRegistry.forceSetRoyaltiesType(token, 7n)).to.be.revertedWith("wrong royaltiesType");
      //only owner can clear royalties
      await expect(royaltiesRegistry.connect(acc3).clearRoyaltiesType(token)).to.be.revertedWith("Token owner not detected");
      //clearRoyaltiesType
      await royaltiesRegistry.clearRoyaltiesType(token);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(0n, "clearRoyaltiesType ")
      expect(await royaltiesRegistry.getProvider(token)).to.equal(ZERO_ADDRESS, "provider is not set")
    })
  })
  describe("upgrade checks", () => {
    it("check storage after upgrade", async function () {
      const [_, acc1, acc2, ___, acc3] = await ethers.getSigners();
      const token = (await new TestERC721__factory().deploy("Test", "TST")).address;
      const token2 = (await new TestERC721__factory().deploy("Test", "TST")).address;
      const token3 = (await new TestERC721__factory().deploy("Test", "TST")).address;
      const tokenId3 = 11234n;
      const royaltiesRegistryOld = await upgrades.deployProxy(new RoyaltiesRegistryOld__factory(), [], { initializer: '__RoyaltiesRegistry_init' }) as RoyaltiesRegistryOld;
      //setRoyaltiesByTokenAndTokenId
      await royaltiesRegistryOld.setRoyaltiesByTokenAndTokenId(token, tokenId3, [{account: await acc3.getAddress(), value: 1000n}])
      //setRoyaltiesByToken
      await royaltiesRegistryOld.setRoyaltiesByToken(token2, [{account: await acc2.getAddress(), value: 900n}])
      //external provider
      const testRoyaltiesProvider = await new RoyaltiesProviderTest__factory().deploy();
      await testRoyaltiesProvider.initializeProvider(token3, defaultTokenId1, [{account: await acc1.getAddress(), value: 800n}]);
      await royaltiesRegistryOld.setProviderByToken(token3, await testRoyaltiesProvider.getAddress())
      const royaltiesFromToken = await royaltiesRegistryOld.getRoyalties.staticCall(token2, tokenId3)
      const royaltiesFromProvider = await royaltiesRegistryOld.getRoyalties.staticCall(token3, defaultTokenId1)
      royaltiesRegistry = await upgrades.upgradeProxy(await royaltiesRegistryOld.getAddress(), new RoyaltiesRegistry__factory()) as RoyaltiesRegistry;
      expect(await royaltiesRegistry.getRoyaltiesType(token2)).to.equal(0n, "")
      expect(await royaltiesRegistry.getRoyaltiesType(token3)).to.equal(0n, "")
      expect((await royaltiesRegistry.getRoyalties.staticCall(token, tokenId3)).length).to.equal(0, "royaltiesFromTokenAndTokenId")
      expect((await royaltiesRegistry.getRoyalties.staticCall(token2, tokenId3))[0].account).to.equal(royaltiesFromToken[0].account, "royaltiesFromToken")
      expect((await royaltiesRegistry.getRoyalties.staticCall(token2, tokenId3))[0].value).to.equal(royaltiesFromToken[0].value, "royaltiesFromToken")
      expect((await royaltiesRegistry.getRoyalties.staticCall(token3, defaultTokenId1))[0].account).to.equal(royaltiesFromProvider[0].account, "royaltiesFromProvider")
      expect((await royaltiesRegistry.getRoyalties.staticCall(token3, defaultTokenId1))[0].value).to.equal(royaltiesFromProvider[0].value, "royaltiesFromProvider")
      await royaltiesRegistry.getRoyalties(token, tokenId3)
      await royaltiesRegistry.getRoyalties(token2, tokenId3)
      await royaltiesRegistry.getRoyalties(token3, tokenId3)
      expect(await royaltiesRegistry.getRoyaltiesType(token2)).to.equal(1n, "royaltiesFromToken type 1")
      expect(await royaltiesRegistry.getRoyaltiesType(token3)).to.equal(4n, "external provider type 4")
    })
  })
});