// <ai_context> Test suite for NftPool contract. Covers initialization, depositing NFTs, withdrawing NFTs, pool management, rescue functionality, and access control. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
const connection = await network.connect();
const { ethers } = connection;
import type * as ethersTypes from "ethers";
import {
  type NftPool,
  NftPool__factory,
  type TestERC721,
  TestERC721__factory,
  type TransparentUpgradeableProxy,
  TransparentUpgradeableProxy__factory,
} from "../types/ethers-contracts";

// Pool types enum values (ordered from common to rare for extensibility)
const PoolType = {
  Common: 0,
  Rare: 1,
  Epic: 2,
  Legendary: 3,
  UltraRare: 4,
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("NftPool", function () {
  let nftPool: NftPool;
  let nftPoolImpl: NftPool;
  let testNft: TestERC721;
  let testNft2: TestERC721;
  let owner: ethersTypes.Signer;
  let poolManager: ethersTypes.Signer;
  let user1: ethersTypes.Signer;
  let user2: ethersTypes.Signer;
  let ownerAddress: string;
  let poolManagerAddress: string;
  let user1Address: string;
  let user2Address: string;

  // Role constants
  let DEFAULT_ADMIN_ROLE: string;
  let POOL_MANAGER_ROLE: string;

  beforeEach(async function () {
    [owner, poolManager, user1, user2] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    poolManagerAddress = await poolManager.getAddress();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();

    // Deploy test NFT contracts
    const TestNftFactory = new TestERC721__factory(owner);
    testNft = await TestNftFactory.deploy("Test NFT", "TNFT");
    await testNft.waitForDeployment();

    testNft2 = await TestNftFactory.deploy("Test NFT 2", "TNFT2");
    await testNft2.waitForDeployment();

    // Deploy NftPool implementation
    const NftPoolFactory = new NftPool__factory(owner);
    nftPoolImpl = await NftPoolFactory.deploy();
    await nftPoolImpl.waitForDeployment();

    // Deploy proxy
    const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);
    const initData = nftPoolImpl.interface.encodeFunctionData("initialize", [
      ownerAddress,
      PoolType.Legendary,
    ]);

    const proxy = await ProxyFactory.deploy(
      await nftPoolImpl.getAddress(),
      ownerAddress, // proxy admin
      initData
    );
    await proxy.waitForDeployment();

    // Get NftPool interface at proxy address
    nftPool = NftPool__factory.connect(await proxy.getAddress(), owner);

    // Get role constants
    DEFAULT_ADMIN_ROLE = await nftPool.DEFAULT_ADMIN_ROLE();
    POOL_MANAGER_ROLE = await nftPool.POOL_MANAGER_ROLE();

    // Allow testNft collection
    await nftPool.addAllowed721Contract(await testNft.getAddress());
  });

  describe("Initialization", function () {
    it("Should initialize with correct pool type", async function () {
      expect(await nftPool.poolType()).to.equal(PoolType.Legendary);
    });

    it("Should set correct owner", async function () {
      expect(await nftPool.owner()).to.equal(ownerAddress);
    });

    it("Should grant DEFAULT_ADMIN_ROLE to owner", async function () {
      expect(await nftPool.hasRole(DEFAULT_ADMIN_ROLE, ownerAddress)).to.be.true;
    });

    it("Should grant POOL_MANAGER_ROLE to owner", async function () {
      expect(await nftPool.hasRole(POOL_MANAGER_ROLE, ownerAddress)).to.be.true;
    });

    it("Should revert initialization with zero address owner", async function () {
      const NftPoolFactory = new NftPool__factory(owner);
      const newPoolImpl = await NftPoolFactory.deploy();
      await newPoolImpl.waitForDeployment();

      const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);
      const initData = newPoolImpl.interface.encodeFunctionData("initialize", [
        ZERO_ADDRESS,
        PoolType.Common,
      ]);

      await expect(
        ProxyFactory.deploy(await newPoolImpl.getAddress(), ownerAddress, initData)
      ).to.be.revertedWithCustomError(newPoolImpl, "ZeroAddress");
    });

    it("Should not allow reinitialization", async function () {
      await expect(
        nftPool.initialize(user1Address, PoolType.Common)
      ).to.be.revertedWithCustomError(nftPool, "InvalidInitialization");
    });
  });

  describe("Allowed Collections", function () {
    it("Should add allowed collection", async function () {
      expect(await nftPool.isAllowed721Contract(await testNft.getAddress())).to.be.true;
    });

    it("Should emit event when adding allowed collection", async function () {
      await expect(nftPool.addAllowed721Contract(await testNft2.getAddress()))
        .to.emit(nftPool, "Allowed721ContractAdded")
        .withArgs(await testNft2.getAddress());
    });

    it("Should remove allowed collection", async function () {
      await nftPool.removeAllowed721Contract(await testNft.getAddress());
      expect(await nftPool.isAllowed721Contract(await testNft.getAddress())).to.be.false;
    });

    it("Should emit event when removing allowed collection", async function () {
      await expect(nftPool.removeAllowed721Contract(await testNft.getAddress()))
        .to.emit(nftPool, "Allowed721ContractRemoved")
        .withArgs(await testNft.getAddress());
    });

    it("Should revert when adding zero address collection", async function () {
      await expect(nftPool.addAllowed721Contract(ZERO_ADDRESS)).to.be.revertedWithCustomError(
        nftPool,
        "ZeroAddress"
      );
    });

    it("Should only allow owner to add collections", async function () {
      await expect(
        nftPool.connect(user1).addAllowed721Contract(await testNft2.getAddress())
      ).to.be.revertedWithCustomError(nftPool, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to remove collections", async function () {
      await expect(
        nftPool.connect(user1).removeAllowed721Contract(await testNft.getAddress())
      ).to.be.revertedWithCustomError(nftPool, "OwnableUnauthorizedAccount");
    });
  });

  describe("Depositing NFTs", function () {
    beforeEach(async function () {
      // Mint some NFTs to user1
      await testNft.mint(user1Address, 1);
      await testNft.mint(user1Address, 2);
      await testNft.mint(user1Address, 3);
    });

    it("Should deposit NFT into pool", async function () {
      await testNft.connect(user1).approve(await nftPool.getAddress(), 1);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 1);

      expect(await nftPool.poolSize()).to.equal(1);
      expect(await nftPool.isNftInPool(await testNft.getAddress(), 1)).to.be.true;
      expect(await testNft.ownerOf(1)).to.equal(await nftPool.getAddress());
    });

    it("Should emit Deposited event", async function () {
      await testNft.connect(user1).approve(await nftPool.getAddress(), 1);

      await expect(nftPool.connect(user1).deposit(await testNft.getAddress(), 1))
        .to.emit(nftPool, "Deposited")
        .withArgs(await testNft.getAddress(), 1, PoolType.Legendary);
    });

    it("Should deposit multiple NFTs", async function () {
      await testNft.connect(user1).approve(await nftPool.getAddress(), 1);
      await testNft.connect(user1).approve(await nftPool.getAddress(), 2);
      await testNft.connect(user1).approve(await nftPool.getAddress(), 3);

      await nftPool.connect(user1).deposit(await testNft.getAddress(), 1);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 2);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 3);

      expect(await nftPool.poolSize()).to.equal(3);
    });

    it("Should revert when depositing from non-allowed collection", async function () {
      await testNft2.mint(user1Address, 1);
      await testNft2.connect(user1).approve(await nftPool.getAddress(), 1);

      await expect(
        nftPool.connect(user1).deposit(await testNft2.getAddress(), 1)
      ).to.be.revertedWithCustomError(nftPool, "CollectionNotAllowed");
    });

    it("Should return correct pool NFT info", async function () {
      await testNft.connect(user1).approve(await nftPool.getAddress(), 1);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 1);

      const [collection, tokenId] = await nftPool.poolNftAt(0);
      expect(collection).to.equal(await testNft.getAddress());
      expect(tokenId).to.equal(1);
    });
  });

  describe("Direct safeTransferFrom to Pool", function () {
    beforeEach(async function () {
      await testNft.mint(user1Address, 1);
      await testNft2.mint(user1Address, 1);
    });

    it("Should accept and track NFT from allowed collection via safeTransferFrom", async function () {
      await testNft
        .connect(user1)
        ["safeTransferFrom(address,address,uint256)"](
          user1Address,
          await nftPool.getAddress(),
          1
        );

      expect(await nftPool.poolSize()).to.equal(1);
      expect(await nftPool.isNftInPool(await testNft.getAddress(), 1)).to.be.true;
    });

    it("Should accept but not track NFT from non-allowed collection", async function () {
      await testNft2
        .connect(user1)
        ["safeTransferFrom(address,address,uint256)"](
          user1Address,
          await nftPool.getAddress(),
          1
        );

      // NFT should be transferred but not tracked
      expect(await testNft2.ownerOf(1)).to.equal(await nftPool.getAddress());
      expect(await nftPool.poolSize()).to.equal(0);
      expect(await nftPool.isNftInPool(await testNft2.getAddress(), 1)).to.be.false;
    });
  });

  describe("Withdrawing NFTs", function () {
    beforeEach(async function () {
      await testNft.mint(user1Address, 1);
      await testNft.mint(user1Address, 2);
      await testNft.connect(user1).approve(await nftPool.getAddress(), 1);
      await testNft.connect(user1).approve(await nftPool.getAddress(), 2);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 1);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 2);
    });

    it("Should allow POOL_MANAGER_ROLE to transfer NFT out", async function () {
      await nftPool.transferNft(await testNft.getAddress(), user2Address, 1);

      expect(await testNft.ownerOf(1)).to.equal(user2Address);
      expect(await nftPool.poolSize()).to.equal(1);
      expect(await nftPool.isNftInPool(await testNft.getAddress(), 1)).to.be.false;
    });

    it("Should emit Withdrawn event", async function () {
      await expect(nftPool.transferNft(await testNft.getAddress(), user2Address, 1))
        .to.emit(nftPool, "Withdrawn")
        .withArgs(user2Address, await testNft.getAddress(), 1, PoolType.Legendary);
    });

    it("Should allow granted POOL_MANAGER_ROLE to transfer NFT out", async function () {
      await nftPool.grantRole(POOL_MANAGER_ROLE, poolManagerAddress);

      await nftPool.connect(poolManager).transferNft(await testNft.getAddress(), user2Address, 1);

      expect(await testNft.ownerOf(1)).to.equal(user2Address);
    });

    it("Should revert when non-POOL_MANAGER_ROLE tries to transfer", async function () {
      await expect(
        nftPool.connect(user1).transferNft(await testNft.getAddress(), user2Address, 1)
      ).to.be.revertedWithCustomError(nftPool, "AccessControlUnauthorizedAccount");
    });

    it("Should revert when transferring NFT not in pool", async function () {
      await expect(
        nftPool.transferNft(await testNft.getAddress(), user2Address, 999)
      ).to.be.revertedWithCustomError(nftPool, "NotInPool");
    });

    it("Should correctly swap and pop when removing from middle", async function () {
      await testNft.mint(user1Address, 3);
      await testNft.connect(user1).approve(await nftPool.getAddress(), 3);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 3);

      // Remove token 1 (first in array)
      await nftPool.transferNft(await testNft.getAddress(), user2Address, 1);

      // Token 3 should now be at index 0
      const [collection, tokenId] = await nftPool.poolNftAt(0);
      expect(collection).to.equal(await testNft.getAddress());
      expect(tokenId).to.equal(3);

      // Pool size should be 2
      expect(await nftPool.poolSize()).to.equal(2);
    });
  });

  describe("Rescue NFTs", function () {
    beforeEach(async function () {
      // Send a non-allowed NFT directly to the pool
      await testNft2.mint(user1Address, 1);
      await testNft2
        .connect(user1)
        ["safeTransferFrom(address,address,uint256)"](
          user1Address,
          await nftPool.getAddress(),
          1
        );
    });

    it("Should allow owner to rescue non-tracked NFT", async function () {
      await nftPool.rescueNft(await testNft2.getAddress(), user2Address, 1);

      expect(await testNft2.ownerOf(1)).to.equal(user2Address);
    });

    it("Should emit RescuedNft event", async function () {
      await expect(nftPool.rescueNft(await testNft2.getAddress(), user2Address, 1))
        .to.emit(nftPool, "RescuedNft")
        .withArgs(user2Address, await testNft2.getAddress(), 1);
    });

    it("Should revert when rescuing tracked NFT", async function () {
      await testNft.mint(user1Address, 1);
      await testNft.connect(user1).approve(await nftPool.getAddress(), 1);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 1);

      await expect(
        nftPool.rescueNft(await testNft.getAddress(), user2Address, 1)
      ).to.be.revertedWith("NftPool: NFT is tracked in pool");
    });

    it("Should revert when non-owner tries to rescue", async function () {
      await expect(
        nftPool.connect(user1).rescueNft(await testNft2.getAddress(), user2Address, 1)
      ).to.be.revertedWithCustomError(nftPool, "OwnableUnauthorizedAccount");
    });

    it("Should revert when rescuing NFT not owned by pool", async function () {
      await testNft2.mint(user1Address, 2);

      await expect(
        nftPool.rescueNft(await testNft2.getAddress(), user2Address, 2)
      ).to.be.revertedWith("NftPool: not owned by pool");
    });
  });

  describe("Pool Views", function () {
    beforeEach(async function () {
      await testNft.mint(user1Address, 1);
      await testNft.mint(user1Address, 2);
      await testNft.connect(user1).approve(await nftPool.getAddress(), 1);
      await testNft.connect(user1).approve(await nftPool.getAddress(), 2);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 1);
      await nftPool.connect(user1).deposit(await testNft.getAddress(), 2);
    });

    it("Should return correct pool size", async function () {
      expect(await nftPool.poolSize()).to.equal(2);
    });

    it("Should return correct NFT pool type", async function () {
      expect(await nftPool.nftPoolOf(await testNft.getAddress(), 1)).to.equal(PoolType.Legendary);
    });

    it("Should revert nftPoolOf for NFT not in pool", async function () {
      await expect(nftPool.nftPoolOf(await testNft.getAddress(), 999)).to.be.revertedWith(
        "NftPool: not in pool"
      );
    });

    it("Should correctly report if NFT is in pool", async function () {
      expect(await nftPool.isNftInPool(await testNft.getAddress(), 1)).to.be.true;
      expect(await nftPool.isNftInPool(await testNft.getAddress(), 999)).to.be.false;
    });
  });

  describe("Role Management", function () {
    it("Should allow admin to grant POOL_MANAGER_ROLE", async function () {
      await nftPool.grantRole(POOL_MANAGER_ROLE, user1Address);
      expect(await nftPool.hasRole(POOL_MANAGER_ROLE, user1Address)).to.be.true;
    });

    it("Should allow admin to revoke POOL_MANAGER_ROLE", async function () {
      await nftPool.grantRole(POOL_MANAGER_ROLE, user1Address);
      await nftPool.revokeRole(POOL_MANAGER_ROLE, user1Address);
      expect(await nftPool.hasRole(POOL_MANAGER_ROLE, user1Address)).to.be.false;
    });

    it("Should not allow non-admin to grant roles", async function () {
      await expect(
        nftPool.connect(user1).grantRole(POOL_MANAGER_ROLE, user2Address)
      ).to.be.revertedWithCustomError(nftPool, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Interface Support", function () {
    it("Should support ERC721Receiver interface", async function () {
      // IERC721Receiver interface ID
      expect(await nftPool.supportsInterface("0x150b7a02")).to.be.true;
    });

    it("Should support AccessControl interface", async function () {
      // IAccessControl interface ID
      expect(await nftPool.supportsInterface("0x7965db0b")).to.be.true;
    });
  });

  describe("Different Pool Types", function () {
    it("Should deploy pools with different types", async function () {
      const NftPoolFactory = new NftPool__factory(owner);
      const ProxyFactory = new TransparentUpgradeableProxy__factory(owner);

      for (const [typeName, typeValue] of Object.entries(PoolType)) {
        const impl = await NftPoolFactory.deploy();
        await impl.waitForDeployment();

        const initData = impl.interface.encodeFunctionData("initialize", [
          ownerAddress,
          typeValue,
        ]);

        const proxy = await ProxyFactory.deploy(
          await impl.getAddress(),
          ownerAddress,
          initData
        );
        await proxy.waitForDeployment();

        const pool = NftPool__factory.connect(await proxy.getAddress(), owner);
        expect(await pool.poolType()).to.equal(typeValue);
      }
    });
  });
});

