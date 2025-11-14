/*
<ai_context>
Additional tests for epoch mechanics and guards in RariReward:
- updateEpoch only callable by EPOCH_ROLE
- updateEpoch must strictly increase total points
- Multi-epoch price calculation correctness with partial claims and new deposits
- ERC20 facade properties & non-transferability
- withdrawFeesETH role requirement and recipient validation
- getClaimable returns zeroes on epoch mismatch
- setRewardToken owner-only negative case
</ai_context>
*/
import { expect } from "chai";
import { BigNumber, Contract, Signer } from "ethers";
import { ethers, upgrades } from "hardhat";
import { RariReward__factory } from "../typechain-types";
const PRICE_SCALE = BigNumber.from("1000000000000000000"); // 1e18
function toWei(n: string) {
  return ethers.utils.parseEther(n);
}
function toUnits(n: string, d = 18) {
  return ethers.utils.parseUnits(n, d);
}
let chainId: number;
async function signClaim(
  backend: Signer,
  rewardAddress: string,
  epoch: BigNumber | number,
  user: string,
  totalPoints: BigNumber | number
): Promise<string> {
  const dataHash = ethers.utils.solidityKeccak256(
    ["uint256", "address", "uint256", "address", "uint256"],
    [chainId, rewardAddress, epoch, user, totalPoints]
  );
  const sig = await (backend as any).signMessage(ethers.utils.arrayify(dataHash));
  return sig;
}
describe("RariReward - Epoch mechanics & guards", function () {
  before(async () => {
    chainId = (await ethers.provider.getNetwork()).chainId;
  });
  async function deployFixture() {
    const [owner, backend, swapper, user, other] = await ethers.getSigners();
    const RariReward = (await ethers.getContractFactory("RariReward")) as RariReward__factory;
    const reward = await upgrades.deployProxy(
      RariReward,
      [owner.address],
      { initializer: "initialize", kind: "transparent" }
    );
    const TestERC20 = await ethers.getContractFactory("TestERC20");
    const rari: Contract = await TestERC20.deploy("RARI", "RARI");
    await rari.deployed();
    const feeToken: Contract = await TestERC20.deploy("FEE", "FEE");
    await feeToken.deployed();
    const EPOCH_ROLE = await reward.EPOCH_ROLE();
    const SWAP_ROLE = await reward.SWAP_ROLE();
    await (await reward.grantRole(EPOCH_ROLE, backend.address)).wait();
    await (await reward.grantRole(SWAP_ROLE, swapper.address)).wait();
    await (await reward.setRewardToken(rari.address)).wait();
    return { owner, backend, swapper, user, other, reward, rari, feeToken, EPOCH_ROLE, SWAP_ROLE };
  }
  it("updateEpoch: only EPOCH_ROLE can call", async () => {
    const { reward, other, EPOCH_ROLE } = await deployFixture();
    await expect(reward.connect(other).updateEpoch(1000))
      .to.be.revertedWithCustomError(reward, "AccessControlUnauthorizedAccount")
      .withArgs(other.address, EPOCH_ROLE);
  });
  it("updateEpoch: must strictly increase total points", async () => {
    const { reward, backend } = await deployFixture();
    // totalAllocatedPoints starts at 0; calling with 0 should revert
    await expect(reward.connect(backend).updateEpoch(0))
      .to.be.revertedWith("Total points must increase");
    // First valid update
    await expect(reward.connect(backend).updateEpoch(1000))
      .to.emit(reward, "EpochUpdated");
    // Same value again should revert
    await expect(reward.connect(backend).updateEpoch(1000))
      .to.be.revertedWith("Total points must increase");
    // Lower value should also revert (still must increase vs previous)
    await expect(reward.connect(backend).updateEpoch(999))
      .to.be.revertedWith("Total points must increase");
  });
  it("multi-epoch price math: reflects current RARI balance and remaining points", async () => {
    const { reward, backend, user, rari } = await deployFixture();
    // Seed 1000 RARI and open epoch with 1000 total points
    await (await rari.mint(reward.address, toUnits("1000"))).wait();
    await (await reward.connect(backend).updateEpoch(1000)).wait();
    const epoch1 = await reward.epochIndex();
    const price1 = await reward.price();
    // price = (rariBalanceWei * 1e18) / points => for 1000/1000 it's 1e36
    expect(price1).to.eq(toUnits("1").mul(PRICE_SCALE));
    // Backend signs cumulative 300 for user; user claims 200 (leaving delta = 100)
    const totalPointsUser1 = BigNumber.from(300);
    const sig1 = await signClaim(backend, reward.address, epoch1, user.address, totalPointsUser1);
    const pointsToClaim1 = BigNumber.from(200);
    const expectedReward1 = pointsToClaim1.mul(price1).div(PRICE_SCALE);
    const balBefore1 = await rari.balanceOf(user.address);
    await expect(reward.connect(user).claimReward(pointsToClaim1, totalPointsUser1, epoch1, sig1))
      .to.emit(reward, "RewardClaimed");
    const balAfter1 = await rari.balanceOf(user.address);
    expect(balAfter1.sub(balBefore1)).to.eq(expectedReward1);
    // Contract RARI balance decreased by 200
    const contractBalAfterClaim = await rari.balanceOf(reward.address);
    expect(contractBalAfterClaim).to.eq(toUnits("1000").sub(expectedReward1));
    // Mint +300 more RARI (swaps happened off-chain)
    await (await rari.mint(reward.address, toUnits("300"))).wait();
    // New RARI balance is (1000 - 200 + 300) = 1100
    const rariBalNow = await rari.balanceOf(reward.address);
    expect(rariBalNow).to.eq(toUnits("1100"));
    // Increase total points to 1500; totalConvertedPoints is 200 -> pointsToReward = 1500 - 200 = 1300
    await (await reward.connect(backend).updateEpoch(1500)).wait();
    const epoch2 = await reward.epochIndex();
    expect(epoch2).to.eq(epoch1.add(1));
    const price2 = await reward.price();
    const expectedPrice2 = rariBalNow.mul(PRICE_SCALE).div(BigNumber.from(1300));
    expect(price2).to.eq(expectedPrice2);
  });
  it("ERC20 facade: metadata, totalSupply mirrors totalConvertedPoints, and non-transferable guards", async () => {
    const { reward, backend, user, rari } = await deployFixture();
    expect(await reward.name()).to.eq("Rari Reward Points");
    expect(await reward.symbol()).to.eq("RariRP");
    expect(await reward.decimals()).to.eq(18);
    // Supply starts at 0
    expect(await reward.totalSupply()).to.eq(0);
    expect(await reward.balanceOf(user.address)).to.eq(0);
    // Seed & update epoch
    await (await rari.mint(reward.address, toUnits("100"))).wait();
    await (await reward.connect(backend).updateEpoch(100)).wait();
    const epoch = await reward.epochIndex();
    // User claims 10 points out of 50 signed
    const totalPoints = BigNumber.from(50);
    const sig = await signClaim(backend, reward.address, epoch, user.address, totalPoints);
    await (await reward.connect(user).claimReward(10, totalPoints, epoch, sig)).wait();
    // totalSupply == totalConvertedPoints == 10; balanceOf(user) == 10
    expect(await reward.totalSupply()).to.eq(10);
    expect(await reward.balanceOf(user.address)).to.eq(10);
    // Non-transferable interface
    await expect(reward.transfer(ethers.constants.AddressZero, 1)).to.be.revertedWith("NON_TRANSFERABLE");
    await expect(reward.approve(ethers.constants.AddressZero, 1)).to.be.revertedWith("NON_TRANSFERABLE");
    await expect(reward.transferFrom(user.address, ethers.constants.AddressZero, 1)).to.be.revertedWith("NON_TRANSFERABLE");
    // allowance is always 0
    expect(await reward.allowance(user.address, reward.address)).to.eq(0);
  });
  it("withdrawFeesETH: requires SWAP_ROLE and valid recipient", async () => {
    const { reward, owner, swapper, other } = await deployFixture();
    // Seed contract with ETH
    await owner.sendTransaction({ to: reward.address, value: toWei("1") });
    // Non-swapper cannot call
    await expect(reward.connect(other).withdrawFeesETH(toWei("0.1"), owner.address))
      .to.be.revertedWithCustomError(reward, "AccessControlUnauthorizedAccount")
      .withArgs(other.address, await reward.SWAP_ROLE());
    // Invalid recipient (zero)
    await expect(reward.connect(swapper).withdrawFeesETH(toWei("0.1"), ethers.constants.AddressZero))
      .to.be.revertedWith("Invalid recipient");
    // Happy path
    const before = await ethers.provider.getBalance(reward.address);
    await expect(reward.connect(swapper).withdrawFeesETH(toWei("0.25"), other.address))
      .to.emit(reward, "FeeWithdrawn")
      .withArgs(swapper.address, ethers.constants.AddressZero, toWei("0.25"), other.address);
    const after = await ethers.provider.getBalance(reward.address);
    expect(before.sub(after)).to.eq(toWei("0.25"));
  });
  it("setRewardToken: only owner can change", async () => {
    const { reward, other } = await deployFixture();
    const TestERC20 = await ethers.getContractFactory("TestERC20");
    const newToken: Contract = await TestERC20.deploy("NEW", "NEW");
    await newToken.deployed();
    await expect(reward.connect(other).setRewardToken(newToken.address))
      .to.be.revertedWithCustomError(reward, "OwnableUnauthorizedAccount")
      .withArgs(other.address);
  });
  it("getClaimable returns (0,0) when epoch mismatches", async () => {
    const { reward, backend, user, rari } = await deployFixture();
    await (await rari.mint(reward.address, toUnits("50"))).wait();
    await (await reward.connect(backend).updateEpoch(200)).wait();
    const epoch = await reward.epochIndex();
    const price = await reward.price();
    // price = (50e18 * 1e18) / 200 = 0.25e36
    expect(price).to.eq(toUnits("0.25").mul(PRICE_SCALE));
    const res = await reward.getClaimable(user.address, epoch.add(1), 100);
    expect(res.claimablePoints).to.eq(0);
    expect(res.claimableAmount).to.eq(0);
  });
  it("claimReward: reverts on zero pointsToClaim or zero totalPoints", async () => {
    const { reward, backend, user, rari } = await deployFixture();
    await (await rari.mint(reward.address, toUnits("10"))).wait();
    await (await reward.connect(backend).updateEpoch(100)).wait();
    const epoch = await reward.epochIndex();
    const sig = await signClaim(backend, reward.address, epoch, user.address, 100);
    // zero pointsToClaim
    await expect(
      reward.connect(user).claimReward(0, 100, epoch, sig)
    ).to.be.revertedWith("No points to claim");
    // zero totalPoints (invalid)
    await expect(
      reward.connect(user).claimReward(1, 0, epoch, sig)
    ).to.be.revertedWith("Total points must be greater than 0");
  });
  it("claimReward: reverts with 'Nothing claimable' if totalPoints <= already claimed", async () => {
    const { reward, backend, user, rari } = await deployFixture();
    await (await rari.mint(reward.address, toUnits("10"))).wait();
    await (await reward.connect(backend).updateEpoch(10)).wait();
    const epoch = await reward.epochIndex();
    const totalPoints = 5;
    const sig = await signClaim(backend, reward.address, epoch, user.address, totalPoints);
    // Claim full 5
    await (await reward.connect(user).claimReward(5, totalPoints, epoch, sig)).wait();
    // Now any further claim should revert as nothing left
    await expect(
      reward.connect(user).claimReward(1, totalPoints, epoch, sig)
    ).to.be.revertedWith("Nothing claimable");
  });
});