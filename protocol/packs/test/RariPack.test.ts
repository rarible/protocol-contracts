// <ai_context> Test suite for RariPack contract. Covers initialization, minting, burning, pricing, treasury management, metadata URIs, and access control. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
const connection = await network.connect();
const { ethers } = connection;
import type * as ethersTypes from "ethers";
import {
  type RariPack,
  RariPack__factory,
  type TransparentUpgradeableProxy,
  TransparentUpgradeableProxy__factory,
} from "../types/ethers-contracts";

// Pack types enum values
const PackType = {
  Bronze: 0,
  Silver: 1,
  Gold: 2,
  Platinum: 3,
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("RariPack", function () {
  let rariPack: RariPack;
  let rariPackImpl: RariPack;
  let owner: ethersTypes.Signer;
  let treasury: ethersTypes.Signer;
  let user1: ethersTypes.Signer;
  let user2: ethersTypes.Signer;
  let burner: ethersTypes.Signer;
  let ownerAddress: string;
  let treasuryAddress: string;
  let user1Address: string;
  let user2Address: string;
  let burnerAddress: string;

  // Role constants
  let DEFAULT_ADMIN_ROLE: string;
  let BURNER_ROLE: string;

  // Prices for different pack types
  const BRONZE_PRICE = ethers.parseEther("0.01");
  const SILVER_PRICE = ethers.parseEther("0.05");
  const GOLD_PRICE = ethers.parseEther("0.1");
  const PLATINUM_PRICE = ethers.parseEther("0.5");

  // URIs for different pack types
  const BRONZE_URI = "ipfs://bronze-pack-metadata";
  const SILVER_URI = "ipfs://silver-pack-metadata";
  const GOLD_URI = "ipfs://gold-pack-metadata";
  const PLATINUM_URI = "ipfs://platinum-pack-metadata";

  beforeEach(async function () {
    [owner, treasury, user1, user2, burner] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    treasuryAddress = await treasury.getAddress();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();
    burnerAddress = await burner.getAddress();

    // Deploy implementation
    const RariPackFactory = new RariPack__factory(owner);
    rariPackImpl = await RariPackFactory.deploy();
    await rariPackImpl.waitForDeployment();

    // Deploy proxy
    const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);
    const initData = rariPackImpl.interface.encodeFunctionData("initialize", [
      ownerAddress,
      treasuryAddress,
      "Rari Pack",
      "RPACK",
    ]);

    const proxy = await ProxyFactory.deploy(
      await rariPackImpl.getAddress(),
      ownerAddress, // proxy admin
      initData
    );
    await proxy.waitForDeployment();

    // Get RariPack interface at proxy address
    rariPack = RariPack__factory.connect(await proxy.getAddress(), owner);

    // Get role constants
    DEFAULT_ADMIN_ROLE = await rariPack.DEFAULT_ADMIN_ROLE();
    BURNER_ROLE = await rariPack.BURNER_ROLE();

    // Set pack prices
    await rariPack.setPackPrice(PackType.Bronze, BRONZE_PRICE);
    await rariPack.setPackPrice(PackType.Silver, SILVER_PRICE);
    await rariPack.setPackPrice(PackType.Gold, GOLD_PRICE);
    await rariPack.setPackPrice(PackType.Platinum, PLATINUM_PRICE);

    // Set pack URIs
    await rariPack.setPackURI(PackType.Bronze, BRONZE_URI);
    await rariPack.setPackURI(PackType.Silver, SILVER_URI);
    await rariPack.setPackURI(PackType.Gold, GOLD_URI);
    await rariPack.setPackURI(PackType.Platinum, PLATINUM_URI);
  });

  describe("Initialization", function () {
    it("Should initialize with correct name and symbol", async function () {
      expect(await rariPack.name()).to.equal("Rari Pack");
      expect(await rariPack.symbol()).to.equal("RPACK");
    });

    it("Should set correct owner", async function () {
      expect(await rariPack.owner()).to.equal(ownerAddress);
    });

    it("Should set correct treasury", async function () {
      expect(await rariPack.treasury()).to.equal(treasuryAddress);
    });

    it("Should grant DEFAULT_ADMIN_ROLE to owner", async function () {
      expect(await rariPack.hasRole(DEFAULT_ADMIN_ROLE, ownerAddress)).to.be.true;
    });

    it("Should grant BURNER_ROLE to owner", async function () {
      expect(await rariPack.hasRole(BURNER_ROLE, ownerAddress)).to.be.true;
    });

    it("Should not allow reinitialization", async function () {
      await expect(
        rariPack.initialize(user1Address, user1Address, "New Name", "NEW")
      ).to.be.revertedWithCustomError(rariPack, "InvalidInitialization");
    });
  });

  describe("Minting Packs", function () {
    it("Should mint a single Bronze pack with correct payment", async function () {
      const treasuryBalanceBefore = await ethers.provider.getBalance(treasuryAddress);

      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });

      expect(await rariPack.balanceOf(user1Address)).to.equal(1);
      expect(await rariPack.ownerOf(1)).to.equal(user1Address);
      expect(await rariPack.packTypeOf(1)).to.equal(PackType.Bronze);

      const treasuryBalanceAfter = await ethers.provider.getBalance(treasuryAddress);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(BRONZE_PRICE);
    });

    it("Should mint multiple packs of same type", async function () {
      const amount = 5n;
      const totalPrice = SILVER_PRICE * amount;

      await rariPack.connect(user1).mintPack(user1Address, PackType.Silver, amount, {
        value: totalPrice,
      });

      expect(await rariPack.balanceOf(user1Address)).to.equal(amount);

      // Check each token has correct pack type
      for (let i = 1n; i <= amount; i++) {
        expect(await rariPack.packTypeOf(i)).to.equal(PackType.Silver);
      }
    });

    it("Should mint packs to a different recipient", async function () {
      await rariPack.connect(user1).mintPack(user2Address, PackType.Gold, 1, {
        value: GOLD_PRICE,
      });

      expect(await rariPack.balanceOf(user2Address)).to.equal(1);
      expect(await rariPack.ownerOf(1)).to.equal(user2Address);
    });

    it("Should increment token IDs correctly across multiple mints", async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 2, {
        value: BRONZE_PRICE * 2n,
      });

      await rariPack.connect(user2).mintPack(user2Address, PackType.Silver, 1, {
        value: SILVER_PRICE,
      });

      expect(await rariPack.ownerOf(1)).to.equal(user1Address);
      expect(await rariPack.ownerOf(2)).to.equal(user1Address);
      expect(await rariPack.ownerOf(3)).to.equal(user2Address);
    });

    it("Should revert when amount is zero", async function () {
      await expect(
        rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 0, {
          value: 0,
        })
      ).to.be.revertedWithCustomError(rariPack, "ZeroAmount");
    });

    it("Should revert when price is not set for pack type", async function () {
      // Deploy new pack without setting prices
      const RariPackFactory = new RariPack__factory(owner);
      const newPackImpl = await RariPackFactory.deploy();
      await newPackImpl.waitForDeployment();

      const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);
      const initData = newPackImpl.interface.encodeFunctionData("initialize", [
        ownerAddress,
        treasuryAddress,
        "New Pack",
        "NPACK",
      ]);

      const proxy = await ProxyFactory.deploy(
        await newPackImpl.getAddress(),
        ownerAddress,
        initData
      );
      await proxy.waitForDeployment();

      const newPack = RariPack__factory.connect(await proxy.getAddress(), owner);

      await expect(
        newPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
          value: BRONZE_PRICE,
        })
      ).to.be.revertedWithCustomError(newPack, "PriceNotSet");
    });

    it("Should revert when incorrect ETH amount is sent", async function () {
      await expect(
        rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
          value: BRONZE_PRICE - 1n,
        })
      ).to.be.revertedWithCustomError(rariPack, "IncorrectEthSent");

      await expect(
        rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
          value: BRONZE_PRICE + 1n,
        })
      ).to.be.revertedWithCustomError(rariPack, "IncorrectEthSent");
    });

    it("Should revert when treasury is not set", async function () {
      await rariPack.setTreasury(ZERO_ADDRESS);

      await expect(
        rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
          value: BRONZE_PRICE,
        })
      ).to.be.revertedWithCustomError(rariPack, "TreasuryNotSet");
    });
  });

  describe("Burning Packs", function () {
    beforeEach(async function () {
      // Mint a pack for testing
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });
    });

    it("Should allow BURNER_ROLE to burn packs", async function () {
      expect(await rariPack.balanceOf(user1Address)).to.equal(1);

      await rariPack.connect(owner).burnPack(1);

      expect(await rariPack.balanceOf(user1Address)).to.equal(0);
    });

    it("Should allow granted BURNER_ROLE address to burn packs", async function () {
      await rariPack.grantRole(BURNER_ROLE, burnerAddress);

      await rariPack.connect(burner).burnPack(1);

      expect(await rariPack.balanceOf(user1Address)).to.equal(0);
    });

    it("Should revert when non-BURNER_ROLE tries to burn", async function () {
      await expect(rariPack.connect(user1).burnPack(1)).to.be.revertedWithCustomError(
        rariPack,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("Should revert when burning non-existent token", async function () {
      await expect(rariPack.connect(owner).burnPack(999)).to.be.revertedWithCustomError(
        rariPack,
        "ERC721NonexistentToken"
      );
    });
  });

  describe("Pack Pricing", function () {
    it("Should return correct prices for each pack type", async function () {
      expect(await rariPack.packPrice(PackType.Bronze)).to.equal(BRONZE_PRICE);
      expect(await rariPack.packPrice(PackType.Silver)).to.equal(SILVER_PRICE);
      expect(await rariPack.packPrice(PackType.Gold)).to.equal(GOLD_PRICE);
      expect(await rariPack.packPrice(PackType.Platinum)).to.equal(PLATINUM_PRICE);
    });

    it("Should return correct prices by ID", async function () {
      expect(await rariPack.packPriceById(0)).to.equal(BRONZE_PRICE);
      expect(await rariPack.packPriceById(1)).to.equal(SILVER_PRICE);
      expect(await rariPack.packPriceById(2)).to.equal(GOLD_PRICE);
      expect(await rariPack.packPriceById(3)).to.equal(PLATINUM_PRICE);
    });

    it("Should revert for invalid pack type ID", async function () {
      await expect(rariPack.packPriceById(4)).to.be.revertedWith(
        "RariPack: invalid pack type id"
      );
    });

    it("Should allow DEFAULT_ADMIN_ROLE to set pack price", async function () {
      const newPrice = ethers.parseEther("0.02");

      await expect(rariPack.setPackPrice(PackType.Bronze, newPrice))
        .to.emit(rariPack, "PackPriceUpdated")
        .withArgs(PackType.Bronze, BRONZE_PRICE, newPrice);

      expect(await rariPack.packPrice(PackType.Bronze)).to.equal(newPrice);
    });

    it("Should revert when non-admin tries to set pack price", async function () {
      await expect(
        rariPack.connect(user1).setPackPrice(PackType.Bronze, ethers.parseEther("0.02"))
      ).to.be.revertedWithCustomError(rariPack, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Treasury Management", function () {
    it("Should allow DEFAULT_ADMIN_ROLE to change treasury", async function () {
      await expect(rariPack.setTreasury(user1Address))
        .to.emit(rariPack, "TreasuryUpdated")
        .withArgs(treasuryAddress, user1Address);

      expect(await rariPack.treasury()).to.equal(user1Address);
    });

    it("Should revert when non-admin tries to change treasury", async function () {
      await expect(
        rariPack.connect(user1).setTreasury(user1Address)
      ).to.be.revertedWithCustomError(rariPack, "AccessControlUnauthorizedAccount");
    });

    it("Should allow setting treasury to zero address", async function () {
      await rariPack.setTreasury(ZERO_ADDRESS);
      expect(await rariPack.treasury()).to.equal(ZERO_ADDRESS);
    });
  });

  describe("Pack URIs and Metadata", function () {
    beforeEach(async function () {
      // Mint some packs
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });
      await rariPack.connect(user1).mintPack(user1Address, PackType.Silver, 1, {
        value: SILVER_PRICE,
      });
    });

    it("Should return correct pack URI for each type", async function () {
      expect(await rariPack.packURI(PackType.Bronze)).to.equal(BRONZE_URI);
      expect(await rariPack.packURI(PackType.Silver)).to.equal(SILVER_URI);
      expect(await rariPack.packURI(PackType.Gold)).to.equal(GOLD_URI);
      expect(await rariPack.packURI(PackType.Platinum)).to.equal(PLATINUM_URI);
    });

    it("Should return correct tokenURI based on pack type", async function () {
      expect(await rariPack.tokenURI(1)).to.equal(BRONZE_URI);
      expect(await rariPack.tokenURI(2)).to.equal(SILVER_URI);
    });

    it("Should revert tokenURI for non-existent token", async function () {
      await expect(rariPack.tokenURI(999)).to.be.revertedWithCustomError(
        rariPack,
        "ERC721NonexistentToken"
      );
    });

    it("Should allow DEFAULT_ADMIN_ROLE to update pack URI", async function () {
      const newURI = "ipfs://new-bronze-uri";

      await expect(rariPack.setPackURI(PackType.Bronze, newURI))
        .to.emit(rariPack, "PackURIUpdated")
        .withArgs(PackType.Bronze, BRONZE_URI, newURI);

      expect(await rariPack.packURI(PackType.Bronze)).to.equal(newURI);
      expect(await rariPack.tokenURI(1)).to.equal(newURI);
    });

    it("Should revert when non-admin tries to set pack URI", async function () {
      await expect(
        rariPack.connect(user1).setPackURI(PackType.Bronze, "new-uri")
      ).to.be.revertedWithCustomError(rariPack, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Pack Type Query", function () {
    beforeEach(async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });
      await rariPack.connect(user1).mintPack(user1Address, PackType.Platinum, 1, {
        value: PLATINUM_PRICE,
      });
    });

    it("Should return correct pack type for tokens", async function () {
      expect(await rariPack.packTypeOf(1)).to.equal(PackType.Bronze);
      expect(await rariPack.packTypeOf(2)).to.equal(PackType.Platinum);
    });

    it("Should revert for non-existent token", async function () {
      await expect(rariPack.packTypeOf(999)).to.be.revertedWithCustomError(
        rariPack,
        "ERC721NonexistentToken"
      );
    });
  });

  describe("Role Management", function () {
    it("Should allow admin to grant BURNER_ROLE", async function () {
      await rariPack.grantRole(BURNER_ROLE, user1Address);
      expect(await rariPack.hasRole(BURNER_ROLE, user1Address)).to.be.true;
    });

    it("Should allow admin to revoke BURNER_ROLE", async function () {
      await rariPack.grantRole(BURNER_ROLE, user1Address);
      await rariPack.revokeRole(BURNER_ROLE, user1Address);
      expect(await rariPack.hasRole(BURNER_ROLE, user1Address)).to.be.false;
    });

    it("Should not allow non-admin to grant roles", async function () {
      await expect(
        rariPack.connect(user1).grantRole(BURNER_ROLE, user2Address)
      ).to.be.revertedWithCustomError(rariPack, "AccessControlUnauthorizedAccount");
    });
  });

  describe("ERC721 Standard", function () {
    beforeEach(async function () {
      await rariPack.connect(user1).mintPack(user1Address, PackType.Bronze, 1, {
        value: BRONZE_PRICE,
      });
    });

    it("Should support ERC721 interface", async function () {
      // ERC721 interface ID
      expect(await rariPack.supportsInterface("0x80ac58cd")).to.be.true;
    });

    it("Should support AccessControl interface", async function () {
      // IAccessControl interface ID
      expect(await rariPack.supportsInterface("0x7965db0b")).to.be.true;
    });

    it("Should allow transfers", async function () {
      await rariPack.connect(user1).transferFrom(user1Address, user2Address, 1);
      expect(await rariPack.ownerOf(1)).to.equal(user2Address);
    });

    it("Should allow approvals", async function () {
      await rariPack.connect(user1).approve(user2Address, 1);
      expect(await rariPack.getApproved(1)).to.equal(user2Address);

      await rariPack.connect(user2).transferFrom(user1Address, user2Address, 1);
      expect(await rariPack.ownerOf(1)).to.equal(user2Address);
    });
  });
});

