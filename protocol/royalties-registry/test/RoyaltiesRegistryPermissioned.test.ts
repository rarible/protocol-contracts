import { expect } from "chai";
import { network } from "hardhat";
// import { ethers } from "hardhat";
import { type HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";
import {
  type RoyaltiesRegistryPermissioned,
  RoyaltiesRegistryPermissioned__factory,
  type TestERC721WithRoyaltiesV1OwnableUpgradeable,
  TestERC721WithRoyaltiesV1OwnableUpgradeable__factory,
  type TestERC721WithRoyaltiesV2OwnableUpgradeable,
  TestERC721WithRoyaltiesV2OwnableUpgradeable__factory,
  type RoyaltiesProviderTest,
  RoyaltiesProviderTest__factory,
  type TestERC721WithRoyaltyV2981,
  TestERC721WithRoyaltyV2981__factory,
  type TestERC721RoyaltyV2Legacy,
  TestERC721RoyaltyV2Legacy__factory,
  type RoyaltiesProviderV2Legacy,
  RoyaltiesProviderV2Legacy__factory,
  type TestERC721ArtBlocks,
  TestERC721ArtBlocks__factory,
  type RoyaltiesProviderArtBlocks,
  RoyaltiesProviderArtBlocks__factory,
  type TestERC721ArtBlocksV2,
  TestERC721ArtBlocksV2__factory,
  type RoyaltiesProviderArtBlocksV2,
  RoyaltiesProviderArtBlocksV2__factory,
} from "../types/ethers-contracts";
// import { LibPart } from "../types/ethers-contracts/contracts/RoyaltiesRegistryPermissioned";
// import { upgrades } from "hardhat";
const connection = await network.connect();
const { ethers } = connection;

/**
<ai_context>
This test verifies behavior of the permissioned royalties registry.
Change log:
2025-10-08: Fix deployment of upgradeable ERC721 mocks (no constructor args).
These mocks are Initializable and must be deployed without params, then initialized.
2025-11-25: Updated for hardhat v3 / ethers v6 compatibility (no hardhat-upgrades).
2025-11-27: Comprehensive tests for all royalty types, roles, and allowed flag.
</ai_context>
*/
describe("RoyaltiesRegistryPermissioned, test methods", function () {
  let royaltiesRegistry: RoyaltiesRegistryPermissioned;
  let testRoyaltiesProvider: RoyaltiesProviderTest;
  let erc721TokenId1 = 51n;
  let erc721TokenId2 = 52n;
  let owner: HardhatEthersSigner; // SignerWithAddress;
  let whitelister: HardhatEthersSigner; // SignerWithAddress;
  let user: HardhatEthersSigner; // SignerWithAddress;
  let acc3: HardhatEthersSigner; // SignerWithAddress;
  let acc4: HardhatEthersSigner; // SignerWithAddress;
  let acc5: HardhatEthersSigner; // SignerWithAddress;
  let acc6: HardhatEthersSigner; // SignerWithAddress;
  let acc7: HardhatEthersSigner; // SignerWithAddress;
  let acc8: HardhatEthersSigner; // SignerWithAddress;
  before(async function () {
    [owner, whitelister, user, acc3, acc4, acc5, acc6, acc7, acc8] = await ethers.getSigners();
  });
  beforeEach(async function () {
    // Deploy registry
    const RoyaltiesRegistryPermissionedFactory = new RoyaltiesRegistryPermissioned__factory(owner);
    royaltiesRegistry = await RoyaltiesRegistryPermissionedFactory.deploy();
    await royaltiesRegistry.waitForDeployment();
    await royaltiesRegistry.__RoyaltiesRegistry_init(owner.address);
    await royaltiesRegistry.connect(owner).grantRole(await royaltiesRegistry.WHITELISTER_ROLE(), whitelister.address);
    // Deploy test royalties provider
    const RoyaltiesProviderTestFactory = new RoyaltiesProviderTest__factory(owner);
    testRoyaltiesProvider = await RoyaltiesProviderTestFactory.deploy();
    await testRoyaltiesProvider.waitForDeployment();
  });
  describe("Initialization and Roles", function () {
    it("should initialize correctly", async function () {
      expect(await royaltiesRegistry.owner()).to.equal(owner.address);
      expect(await royaltiesRegistry.hasRole(await royaltiesRegistry.WHITELISTER_ROLE(), whitelister.address)).to.be.true;
    });
  });
  describe("setRoyaltiesAllowed", function () {
    it("should allow whitelister to set royaltiesAllowed", async function () {
      const tx = await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowed(user.address, true);
      await expect(tx)
        .to.emit(royaltiesRegistry, "RoyaltiesAllowedChanged")
        .withArgs(user.address, true);
      expect(await royaltiesRegistry.royaltiesAllowed(user.address)).to.be.true;
    });
    it("should revert if non-whitelister tries to set royaltiesAllowed", async function () {
      await expect(royaltiesRegistry.connect(user).setRoyaltiesAllowed(user.address, true)).to.be.revertedWith(
        "not whitelister",
      );
    });
    it("should allow whitelister to set royaltiesAllowedBulk", async function () {
      const tokens = [user.address, acc3.address];
      const tx = await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowedBulk(tokens, true);
      await expect(tx)
        .to.emit(royaltiesRegistry, "RoyaltiesAllowedChanged")
        .withArgs(user.address, true);
      await expect(tx)
        .to.emit(royaltiesRegistry, "RoyaltiesAllowedChanged")
        .withArgs(acc3.address, true);
      expect(await royaltiesRegistry.royaltiesAllowed(user.address)).to.be.true;
      expect(await royaltiesRegistry.royaltiesAllowed(acc3.address)).to.be.true;
    });
    it("should revert if non-whitelister tries to set royaltiesAllowedBulk", async function () {
      const tokens = [user.address, acc3.address];
      await expect(royaltiesRegistry.connect(user).setRoyaltiesAllowedBulk(tokens, true)).to.be.revertedWith(
        "not whitelister",
      );
    });
  });
  describe("RoyaltiesRegistryPermissioned token supports IERC2981:", () => {
    let ERC721_V2981: TestERC721WithRoyaltyV2981;
    beforeEach(async function () {
      const ERC721_V2981Factory = new TestERC721WithRoyaltyV2981__factory(owner);
      ERC721_V2981 = await ERC721_V2981Factory.deploy();
      await ERC721_V2981.waitForDeployment();
      await ERC721_V2981.connect(owner).initialize("Rarible", "RARI", "https://ipfs.rarible.com");
    });
    it("Get 10% royalties by token, if allowed", async function () {
      const getRoyalties = await user.getAddress();
      const tokenId = (BigInt(getRoyalties) << 96n) | 1n;
      await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowed(await ERC721_V2981.getAddress(), true);
      const part = await royaltiesRegistry.getRoyalties.staticCall(await ERC721_V2981.getAddress(), tokenId);
      expect(part[0].value).to.equal(1000n);
      expect(part[0].account).to.equal(getRoyalties);
      expect(part.length).to.equal(1);
    });
    it("Get 10% royalties by token, if not allowed - empty", async function () {
      const getRoyalties = await user.getAddress();
      const tokenId = (BigInt(getRoyalties) << 96n) | 1n;
      const part = await royaltiesRegistry.getRoyalties.staticCall(await ERC721_V2981.getAddress(), tokenId);
      expect(part.length).to.equal(0);
    });
    it("Get different % 2981 royalties by token, if allowed", async function () {
      const getRoyalties = await user.getAddress();
      const tokenId = (BigInt(getRoyalties) << 96n) | 1n;
      await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowed(await ERC721_V2981.getAddress(), true);
      // royalties 4.2%
      await ERC721_V2981.connect(owner).setRoyalties(420n);
      const part1 = await royaltiesRegistry.getRoyalties.staticCall(await ERC721_V2981.getAddress(), tokenId);
      expect(part1[0].value).to.equal(420n);
      expect(part1[0].account).to.equal(getRoyalties);
      expect(part1.length).to.equal(1);
      // royalties 0.01%
      await ERC721_V2981.connect(owner).setRoyalties(1n);
      const part2 = await royaltiesRegistry.getRoyalties.staticCall(await ERC721_V2981.getAddress(), tokenId);
      expect(part2[0].value).to.equal(1n);
      expect(part2[0].account).to.equal(getRoyalties);
      expect(part2.length).to.equal(1);
      // royalties 50%
      await ERC721_V2981.connect(owner).setRoyalties(5000n);
      const part3 = await royaltiesRegistry.getRoyalties.staticCall(await ERC721_V2981.getAddress(), tokenId);
      expect(part3[0].value).to.equal(5000n);
      expect(part3[0].account).to.equal(getRoyalties);
      expect(part3.length).to.equal(1);
    });
  });
  describe("RoyaltiesRegistryPermissioned methods works:", () => {
    it("simple V1 royalties, if allowed", async function () {
      const ERC721_V1OwnUpgrd = await new TestERC721WithRoyaltiesV1OwnableUpgradeable__factory(owner).deploy();
      await ERC721_V1OwnUpgrd.waitForDeployment();
      await ERC721_V1OwnUpgrd.connect(owner).initialize("Rarible", "RARI", "https://ipfs.rarible.com"); //set V1 interface
      await ERC721_V1OwnUpgrd.connect(owner).mint(user.address, erc721TokenId1, [
        { account: acc5.address, value: 1000n },
        { account: acc7.address, value: 1200n },
      ]); //set royalties by contract
      await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowed(await ERC721_V1OwnUpgrd.getAddress(), true);
      const royalties = await royaltiesRegistry.getRoyalties.staticCall(await ERC721_V1OwnUpgrd.getAddress(), erc721TokenId1);
      expect(royalties[0].value).to.equal(1000n);
      expect(royalties[1].value).to.equal(1200n);
      expect(royalties.length).to.equal(2);
    });
    it("simple V1 royalties, if not allowed - empty", async function () {
      const ERC721_V1OwnUpgrd = await new TestERC721WithRoyaltiesV1OwnableUpgradeable__factory(owner).deploy();
      await ERC721_V1OwnUpgrd.waitForDeployment();
      await ERC721_V1OwnUpgrd.connect(owner).initialize("Rarible", "RARI", "https://ipfs.rarible.com"); //set V1 interface
      await ERC721_V1OwnUpgrd.connect(owner).mint(user.address, erc721TokenId1, [
        { account: acc5.address, value: 1000n },
        { account: acc7.address, value: 1200n },
      ]); //set royalties by contract
      const royalties = await royaltiesRegistry.getRoyalties.staticCall(await ERC721_V1OwnUpgrd.getAddress(), erc721TokenId1);
      expect(royalties.length).to.equal(0);
    });
    it("simple V1 royalties, set empty, check empty, if allowed", async function () {
      const ERC721_V1OwnUpgrd = await new TestERC721WithRoyaltiesV1OwnableUpgradeable__factory(owner).deploy();
      await ERC721_V1OwnUpgrd.waitForDeployment();
      await ERC721_V1OwnUpgrd.connect(owner).initialize("Rarible", "RARI", "https://ipfs.rarible.com"); //set V1 interface
      await ERC721_V1OwnUpgrd.connect(owner).mint(user.address, erc721TokenId1, []); //set royalties by contract empty
      await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowed(await ERC721_V1OwnUpgrd.getAddress(), true);
      const royalties = await royaltiesRegistry.getRoyalties.staticCall(await ERC721_V1OwnUpgrd.getAddress(), erc721TokenId1);
      expect(royalties.length).to.equal(0);
    });
    it("simple V2 royalties, if allowed", async function () {
      const ERC721_V2OwnUpgrd = await new TestERC721WithRoyaltiesV2OwnableUpgradeable__factory(owner).deploy();
      await ERC721_V2OwnUpgrd.waitForDeployment();
      await ERC721_V2OwnUpgrd.connect(owner).initialize("Rarible", "RARI", "https://ipfs.rarible.com"); //set V2 interface
      await ERC721_V2OwnUpgrd.connect(owner).mint(user.address, erc721TokenId1, [
        { account: acc5.address, value: 700n },
        { account: acc6.address, value: 800n },
        { account: acc7.address, value: 900n },
        { account: acc8.address, value: 1000n },
      ]); //set royalties by contract
      await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowed(await ERC721_V2OwnUpgrd.getAddress(), true);
      const royalties = await royaltiesRegistry.getRoyalties.staticCall(await ERC721_V2OwnUpgrd.getAddress(), erc721TokenId1);
      expect(royalties[0].value).to.equal(700n);
      expect(royalties[1].value).to.equal(800n);
      expect(royalties[2].value).to.equal(900n);
      expect(royalties[3].value).to.equal(1000n);
      expect(royalties.length).to.equal(4);
    });
    it("simple V2 royalties, if not allowed - empty", async function () {
      const ERC721_V2OwnUpgrd = await new TestERC721WithRoyaltiesV2OwnableUpgradeable__factory(owner).deploy();
      await ERC721_V2OwnUpgrd.waitForDeployment();
      await ERC721_V2OwnUpgrd.connect(owner).initialize("Rarible", "RARI", "https://ipfs.rarible.com"); //set V2 interface
      await ERC721_V2OwnUpgrd.connect(owner).mint(user.address, erc721TokenId1, [
        { account: acc5.address, value: 700n },
        { account: acc6.address, value: 800n },
        { account: acc7.address, value: 900n },
        { account: acc8.address, value: 1000n },
      ]); //set royalties by contract
      const royalties = await royaltiesRegistry.getRoyalties.staticCall(await ERC721_V2OwnUpgrd.getAddress(), erc721TokenId1);
      expect(royalties.length).to.equal(0);
    });
    it("simple V2 royalties, set empty, check empty, if allowed", async function () {
      const ERC721_V2OwnUpgrd = await new TestERC721WithRoyaltiesV2OwnableUpgradeable__factory(owner).deploy();
      await ERC721_V2OwnUpgrd.waitForDeployment();
      await ERC721_V2OwnUpgrd.connect(owner).initialize("Rarible", "RARI", "https://ipfs.rarible.com"); //set V2 interface
      await ERC721_V2OwnUpgrd.connect(owner).mint(user.address, erc721TokenId1, []); //set royalties by contract empty
      await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowed(await ERC721_V2OwnUpgrd.getAddress(), true);
      const royalties = await royaltiesRegistry.getRoyalties.staticCall(await ERC721_V2OwnUpgrd.getAddress(), erc721TokenId1);
      expect(royalties.length).to.equal(0);
    });
    it("SetRoyaltiesByToken, initialize by Owner, get royalties if allowed", async function () {
      const token = user.address;
      await royaltiesRegistry.connect(owner).setRoyaltiesByToken(token, [
        { account: acc3.address, value: 600n },
        { account: acc4.address, value: 1100n },
      ]); //set royalties by token
      await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowed(token, true);
      const royalties = await royaltiesRegistry.getRoyalties.staticCall(token, erc721TokenId1);
      expect(royalties.length).to.equal(2);
      expect(royalties[0].value).to.equal(600n);
      expect(royalties[1].value).to.equal(1100n);
    });
    it("SetRoyaltiesByToken, initialize by Owner, get royalties if not allowed - empty", async function () {
      const token = user.address;
      await royaltiesRegistry.connect(owner).setRoyaltiesByToken(token, [
        { account: acc3.address, value: 600n },
        { account: acc4.address, value: 1100n },
      ]); //set royalties by token
      const royalties = await royaltiesRegistry.getRoyalties.staticCall(token, erc721TokenId1);
      expect(royalties.length).to.equal(0);
    });
    it("SetRoyaltiesByToken, initialize by OwnableUpgradeable.owner", async function () {
      const ERC721_V1OwnUpgrd = await new TestERC721WithRoyaltiesV1OwnableUpgradeable__factory(owner).deploy();
      await ERC721_V1OwnUpgrd.waitForDeployment();
      await ERC721_V1OwnUpgrd.connect(owner).initialize("Rarible", "RARI", "https://ipfs.rarible.com");
      await ERC721_V1OwnUpgrd.connect(owner).mint(user.address, erc721TokenId1, []);
      await royaltiesRegistry
        .connect(owner)
        .setRoyaltiesByToken(await ERC721_V1OwnUpgrd.getAddress(), [
          { account: acc3.address, value: 500n },
          { account: acc4.address, value: 1000n },
        ]); //set royalties by token
      await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowed(await ERC721_V1OwnUpgrd.getAddress(), true);
      const royalties = await royaltiesRegistry.getRoyalties.staticCall(await ERC721_V1OwnUpgrd.getAddress(), erc721TokenId1);
      expect(royalties[0].value).to.equal(500n);
      expect(royalties[1].value).to.equal(1000n);
    });
  });
  describe("ExternalProviders test:", () => {
    it("using royaltiesProvider v2 legacy, if allowed", async function () {
      const token = await new TestERC721RoyaltyV2Legacy__factory(owner).deploy();
      await token.waitForDeployment();
      await token.connect(owner).initialize("Rarible", "RARI", "https://ipfs.rarible.com");
      const provider = await new RoyaltiesProviderV2Legacy__factory(owner).deploy();
      await provider.waitForDeployment();
      await royaltiesRegistry.connect(owner).setProviderByToken(await token.getAddress(), await provider.getAddress());
      const royaltiesToSet = [{ account: user.address, value: 1000n }];
      await token.connect(owner).mint(user.address, erc721TokenId1);
      await token.connect(owner)._saveRoyalties(erc721TokenId1, royaltiesToSet);
      await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowed(await token.getAddress(), true);
      const royalties = await royaltiesRegistry.getRoyalties.staticCall(await token.getAddress(), erc721TokenId1);
      expect(royalties[0].account).to.equal(royaltiesToSet[0].account, "royalty recepient 0");
      expect(royalties[0].value).to.equal(royaltiesToSet[0].value, "token address 0");
    });
    it("using royaltiesProvider v2 legacy, if not allowed - empty", async function () {
      const token = await new TestERC721RoyaltyV2Legacy__factory(owner).deploy();
      await token.waitForDeployment();
      await token.connect(owner).initialize("Rarible", "RARI", "https://ipfs.rarible.com");
      const provider = await new RoyaltiesProviderV2Legacy__factory(owner).deploy();
      await provider.waitForDeployment();
      await royaltiesRegistry.connect(owner).setProviderByToken(await token.getAddress(), await provider.getAddress());
      const royaltiesToSet = [{ account: user.address, value: 1000n }];
      await token.connect(owner).mint(user.address, erc721TokenId1);
      await token.connect(owner)._saveRoyalties(erc721TokenId1, royaltiesToSet);
      const royalties = await royaltiesRegistry.getRoyalties.staticCall(await token.getAddress(), erc721TokenId1);
      expect(royalties.length).to.equal(0);
    });
    it("using royaltiesProvider artBlocks, if allowed", async function () {
      const artBlocksAddr = acc5.address;
      const artistAdrr = user.address;
      const addPayeeAddr = acc4.address;
      //deploying contracts
      const token = await new TestERC721ArtBlocks__factory(owner).deploy();
      await token.waitForDeployment();
      await token.connect(owner).initialize("Rarible", "RARI", "https://ipfs.rarible.com");
      const provider = await new RoyaltiesProviderArtBlocks__factory(acc5).deploy(acc5.address);
      await provider.waitForDeployment();
      expect(await provider.owner()).to.equal(artBlocksAddr, "owner");
      expect(await provider.artblocksPercentage()).to.equal(250n, "artblocksPercentage");
      //setting provider in registry
      await royaltiesRegistry.connect(owner).setProviderByToken(await token.getAddress(), await provider.getAddress());
      //creating token and setting royalties
      await token.connect(owner).mint(artistAdrr, erc721TokenId1);
      await token.connect(owner).updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 44n);
      await token.connect(owner).updateProjectSecondaryMarketRoyaltyPercentage(erc721TokenId1, 15n);
      await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowed(await token.getAddress(), true);
      //getting royalties for token
      const royaltiesFromProvider = await provider.getRoyalties(await token.getAddress(), erc721TokenId1);
      expect(royaltiesFromProvider[0].account).to.equal(artBlocksAddr, "artBlocks royalty address");
      expect(royaltiesFromProvider[0].value).to.equal(250n, "artBlocks royalty percentage");
      expect(royaltiesFromProvider[1].account).to.equal(artistAdrr, "artist royalty address");
      expect(royaltiesFromProvider[1].value).to.equal(840n, "artBlocks royalty percentage");
      expect(royaltiesFromProvider[2].account).to.equal(addPayeeAddr, "additional payee royalty address");
      expect(royaltiesFromProvider[2].value).to.equal(660n, "additional payee royalty percentage");
      //changing artBlocksAddr
      const newArtBlocksAddr = acc6.address;
      await provider.connect(acc5).transferOwnership(newArtBlocksAddr);
      await expect(provider.connect(acc5).transferOwnership(artBlocksAddr))
        .to.be.revertedWithCustomError(provider, "OwnableUnauthorizedAccount")
        .withArgs(acc5.address);
      //checking royalties
      const royalties = await royaltiesRegistry.getRoyalties.staticCall(await token.getAddress(), erc721TokenId1);
      expect(royalties[0].account).to.equal(newArtBlocksAddr, "artBlocks addr");
      expect(royalties[0].value).to.equal(250n, "artBlocks value");
      expect(royalties[1].account).to.equal(artistAdrr, "artist addr");
      expect(royalties[1].value).to.equal(840n, "artist value");
      expect(royalties[2].account).to.equal(addPayeeAddr, "additional payee addr");
      expect(royalties[2].value).to.equal(660n, "additional payee value");
      //setting new artblocksPercentage
      await provider.connect(acc6).setArtblocksPercentage(300n);
      //only owner can set %
      await expect(provider.connect(acc5).setArtblocksPercentage(0n))
        .to.be.revertedWithCustomError(provider, "OwnableUnauthorizedAccount")
        .withArgs(acc5.address);
      // _artblocksPercentage can't be over 10000
      await expect(provider.connect(acc6).setArtblocksPercentage(100000n)).to.be.revertedWith("_artblocksPercentage can't be > 100%");
    });
    it("using royaltiesProvider artBlocksV2, if allowed", async function () {
      const artistAdrr = user.address;
      const tokenID = 455000355n;
      const recipient0 = "0x21E0106F464770F528A491383A1957569F886Dc7";
      const recipient1 = "0xC40FD6D2A8e06ba753F6Fd3CB562835Eff990b51";
      const bps0 = 1000n;
      const bps1 = 250n;
      const token = await new TestERC721ArtBlocksV2__factory(owner).deploy();
      await token.waitForDeployment();
      await token.connect(owner).initialize("ArtBlockV2", "ABV2", "");
      const provider = await new RoyaltiesProviderArtBlocksV2__factory(owner).deploy();
      await provider.waitForDeployment();
      //setting provider in registry
      await royaltiesRegistry.connect(owner).setProviderByToken(await token.getAddress(), await provider.getAddress());
      //creating token and setting royalties
      await token.connect(owner).mint(artistAdrr, tokenID);
      await token.connect(owner).setRoyalties(tokenID, [recipient0, recipient1], [bps0, bps1]);
      await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowed(await token.getAddress(), true);
      const royaltiesFromProvider = await provider.getRoyalties(await token.getAddress(), tokenID);
      expect(royaltiesFromProvider[0].account).to.equal(recipient0);
      expect(royaltiesFromProvider[1].account).to.equal(recipient1);
      expect(royaltiesFromProvider[0].value).to.equal(bps0);
      expect(royaltiesFromProvider[1].value).to.equal(bps1);
    });
    it("SetProviderByToken, initialize by Owner, if allowed", async function () {
      const ERC721_V1OwnUpgrd = await new TestERC721WithRoyaltiesV1OwnableUpgradeable__factory(owner).deploy();
      await ERC721_V1OwnUpgrd.waitForDeployment();
      await ERC721_V1OwnUpgrd.connect(owner).initialize("Rarible", "RARI", "https://ipfs.rarible.com");
      await testRoyaltiesProvider.connect(owner).initializeProvider(await ERC721_V1OwnUpgrd.getAddress(), erc721TokenId1, [
        { account: acc3.address, value: 500n },
        { account: acc4.address, value: 1000n },
      ]); //initialize royalties provider
      await ERC721_V1OwnUpgrd.connect(owner).mint(user.address, erc721TokenId1, []);
      await royaltiesRegistry.connect(owner).setProviderByToken(await ERC721_V1OwnUpgrd.getAddress(), await testRoyaltiesProvider.getAddress()); //set royalties by provider
      await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowed(await ERC721_V1OwnUpgrd.getAddress(), true);
      const royalties = await royaltiesRegistry.getRoyalties.staticCall(await ERC721_V1OwnUpgrd.getAddress(), erc721TokenId1);
      expect(royalties[0].value).to.equal(500n);
      expect(royalties[1].value).to.equal(1000n);
    });
    it("SetProviderByToken, initialize by Owner, if not allowed - empty", async function () {
      const ERC721_V1OwnUpgrd = await new TestERC721WithRoyaltiesV1OwnableUpgradeable__factory(owner).deploy();
      await ERC721_V1OwnUpgrd.waitForDeployment();
      await ERC721_V1OwnUpgrd.connect(owner).initialize("Rarible", "RARI", "https://ipfs.rarible.com");
      await testRoyaltiesProvider.connect(owner).initializeProvider(await ERC721_V1OwnUpgrd.getAddress(), erc721TokenId1, [
        { account: acc3.address, value: 500n },
        { account: acc4.address, value: 1000n },
      ]); //initialize royalties provider
      await ERC721_V1OwnUpgrd.connect(owner).mint(user.address, erc721TokenId1, []);
      await royaltiesRegistry.connect(owner).setProviderByToken(await ERC721_V1OwnUpgrd.getAddress(), await testRoyaltiesProvider.getAddress()); //set royalties by provider
      const royalties = await royaltiesRegistry.getRoyalties.staticCall(await ERC721_V1OwnUpgrd.getAddress(), erc721TokenId1);
      expect(royalties.length).to.equal(0);
    });
    it("SetProviderByToken + ContractRoyalties, which not work, because royalties detect by provider, initialize by Owner, if allowed", async function () {
      const ERC721_V1OwnUpgrd = await new TestERC721WithRoyaltiesV1OwnableUpgradeable__factory(owner).deploy();
      await ERC721_V1OwnUpgrd.waitForDeployment();
      await ERC721_V1OwnUpgrd.connect(owner).initialize("Rarible", "RARI", "https://ipfs.rarible.com"); //set V1 interface
      await testRoyaltiesProvider.connect(owner).initializeProvider(await ERC721_V1OwnUpgrd.getAddress(), erc721TokenId1, [
        { account: acc3.address, value: 500n },
        { account: acc4.address, value: 1000n },
      ]); //initialize royalties provider
      await ERC721_V1OwnUpgrd.connect(owner).mint(user.address, erc721TokenId1, [
        { account: acc5.address, value: 1000n },
        { account: acc7.address, value: 1200n },
      ]); //set royalties by contract
      await royaltiesRegistry.connect(owner).setProviderByToken(await ERC721_V1OwnUpgrd.getAddress(), await testRoyaltiesProvider.getAddress()); //set royalties by provider
      await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowed(await ERC721_V1OwnUpgrd.getAddress(), true);
      const royalties = await royaltiesRegistry.getRoyalties.staticCall(await ERC721_V1OwnUpgrd.getAddress(), erc721TokenId1);
      expect(royalties[0].value).to.equal(500n);
      expect(royalties[1].value).to.equal(1000n);
      expect(royalties.length).to.equal(2);
    });
    it("SetProviderByToken, initialize by ownableUpgradaeble(ERC721_V1OwnUpgrd).owner, if allowed ", async function () {
      const ERC721_V1OwnUpgrd = await new TestERC721WithRoyaltiesV1OwnableUpgradeable__factory(owner).deploy();
      await ERC721_V1OwnUpgrd.waitForDeployment();
      await ERC721_V1OwnUpgrd.connect(owner).initialize("Rarible", "RARI", "https://ipfs.rarible.com");
      await testRoyaltiesProvider.connect(owner).initializeProvider(await ERC721_V1OwnUpgrd.getAddress(), erc721TokenId1, [
        { account: acc3.address, value: 600n },
        { account: acc4.address, value: 1100n },
      ]); //initialize royalties provider
      await ERC721_V1OwnUpgrd.connect(owner).mint(user.address, erc721TokenId1, []);
      await royaltiesRegistry
        .connect(owner)
        .setProviderByToken(await ERC721_V1OwnUpgrd.getAddress(), await testRoyaltiesProvider.getAddress()); //set royalties by provider
      await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowed(await ERC721_V1OwnUpgrd.getAddress(), true);
      const royalties = await royaltiesRegistry.getRoyalties.staticCall(await ERC721_V1OwnUpgrd.getAddress(), erc721TokenId1);
      expect(royalties[0].value).to.equal(600n);
      expect(royalties[1].value).to.equal(1100n);
      expect(royalties.length).to.equal(2);
    });
    it("SetProviderByToken, initialize by ownableUpgradaeble(ERC721_V1OwnUpgrd).owner, royalties for erc721TokenId2 should be empty, if allowed", async function () {
      const ERC721_V1OwnUpgrd = await new TestERC721WithRoyaltiesV1OwnableUpgradeable__factory(owner).deploy();
      await ERC721_V1OwnUpgrd.waitForDeployment();
      await ERC721_V1OwnUpgrd.connect(owner).initialize("Rarible", "RARI", "https://ipfs.rarible.com");
      await testRoyaltiesProvider.connect(owner).initializeProvider(await ERC721_V1OwnUpgrd.getAddress(), erc721TokenId1, [
        { account: acc3.address, value: 600n },
        { account: acc4.address, value: 1100n },
      ]); //initialize royalties provider
      await ERC721_V1OwnUpgrd.connect(owner).mint(user.address, erc721TokenId2, []);
      await royaltiesRegistry
        .connect(owner)
        .setProviderByToken(await ERC721_V1OwnUpgrd.getAddress(), await testRoyaltiesProvider.getAddress()); //set royalties by provider
      await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowed(await ERC721_V1OwnUpgrd.getAddress(), true);
      const royalties = await royaltiesRegistry.getRoyalties.staticCall(await ERC721_V1OwnUpgrd.getAddress(), erc721TokenId2);
      expect(royalties.length).to.equal(0);
    });
  });
  describe("royalties types are set correctly", () => {
    it("test royalties type = 1, royalties set in royaltiesByToken, if allowed", async function () {
      const token = user.address;
      await royaltiesRegistry.connect(owner).setRoyaltiesByToken(token, [
        { account: acc3.address, value: 600n },
        { account: acc4.address, value: 1100n },
      ]);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(6n, "type = 6 if not allowed");
      await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowed(token, true);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(1n, "setRoyaltiesByToken type = 1");
    });
    it("test royalties type = 2, royalties v2, if allowed", async function () {
      const ERC721_V2OwnUpgrd = await new TestERC721WithRoyaltiesV2OwnableUpgradeable__factory(owner).deploy();
      await ERC721_V2OwnUpgrd.waitForDeployment();
      await ERC721_V2OwnUpgrd.connect(owner).initialize("Rarible", "RARI", "https://ipfs.rarible.com"); //set V2 interface
      await ERC721_V2OwnUpgrd.connect(owner).mint(user.address, erc721TokenId1, [
        { account: acc5.address, value: 700n },
        { account: acc6.address, value: 800n },
      ]);
      expect(await royaltiesRegistry.getRoyaltiesType(await ERC721_V2OwnUpgrd.getAddress())).to.equal(6n, "type = 6 if not allowed");
      await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowed(await ERC721_V2OwnUpgrd.getAddress(), true);
      await royaltiesRegistry.getRoyalties(await ERC721_V2OwnUpgrd.getAddress(), erc721TokenId1);
      expect(await royaltiesRegistry.getRoyaltiesType(await ERC721_V2OwnUpgrd.getAddress())).to.equal(
        2n,
        "correct royalties type",
      );
    });
    it("test royalties type = 3, royalties v1, if allowed", async function () {
      const ERC721_V1OwnUpgrd = await new TestERC721WithRoyaltiesV1OwnableUpgradeable__factory(owner).deploy();
      await ERC721_V1OwnUpgrd.waitForDeployment();
      await ERC721_V1OwnUpgrd.connect(owner).initialize("Rarible", "RARI", "https://ipfs.rarible.com"); //set V1 interface
      await ERC721_V1OwnUpgrd.connect(owner).mint(user.address, erc721TokenId1, [
        { account: acc5.address, value: 1000n },
        { account: acc7.address, value: 1200n },
      ]);
      expect(await royaltiesRegistry.getRoyaltiesType(await ERC721_V1OwnUpgrd.getAddress())).to.equal(6n, "type = 6 if not allowed");
      await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowed(await ERC721_V1OwnUpgrd.getAddress(), true);
      await royaltiesRegistry.getRoyalties(await ERC721_V1OwnUpgrd.getAddress(), erc721TokenId1);
      expect(await royaltiesRegistry.getRoyaltiesType(await ERC721_V1OwnUpgrd.getAddress())).to.equal(
        3n,
        "correct royalties type",
      );
    });
    it("test royalties type = 4, royalties from external provider, if allowed", async function () {
      const token = user.address;
      const provider = await new RoyaltiesProviderTest__factory(owner).deploy();
      await provider.waitForDeployment();
      await provider.connect(owner).initializeProvider(token, erc721TokenId1, [
        { account: acc3.address, value: 500n },
        { account: acc4.address, value: 1000n },
      ]);
      await royaltiesRegistry.connect(owner).setProviderByToken(token, await provider.getAddress());
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(6n, "type = 6 if not allowed");
      await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowed(token, true);
      await royaltiesRegistry.getRoyalties(token, erc721TokenId1);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(4n, "external provider type = 4");
    });
    it("test royalties type = 5, royalties 2981, if allowed", async function () {
      const getRoyalties = await user.getAddress();
      const tokenId = (BigInt(getRoyalties) << 96n) | 1n;
      const ERC721_V2981 = await new TestERC721WithRoyaltyV2981__factory(owner).deploy();
      await ERC721_V2981.waitForDeployment();
      await ERC721_V2981.connect(owner).initialize("Rarible", "RARI", "https://ipfs.rarible.com");
      expect(await royaltiesRegistry.getRoyaltiesType(await ERC721_V2981.getAddress())).to.equal(6n, "type = 6 if not allowed");
      await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowed(await ERC721_V2981.getAddress(), true);
      await royaltiesRegistry.getRoyalties(await ERC721_V2981.getAddress(), tokenId);
      expect(await royaltiesRegistry.getRoyaltiesType(await ERC721_V2981.getAddress())).to.equal(
        5n,
        "correct royalties type",
      );
    });
    it("test royalties type = 6, no royalties contract, even if allowed", async function () {
      const token = user.address;
      await royaltiesRegistry.connect(whitelister).setRoyaltiesAllowed(token, true);
      const royalties = await royaltiesRegistry.getRoyalties.staticCall(token, erc721TokenId1);
      expect(royalties.length).to.equal(0);
      expect(await royaltiesRegistry.getRoyaltiesType(token)).to.equal(6n, "type 6 ");
    });
  });
});