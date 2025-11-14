/*
<ai_context>
Tests for RariReward.sol:
- Deployment & initialization
- Role assignment and owner-only flows
- setRewardToken
- withdrawFees (ETH and ERC20) with SWAP_ROLE, and restriction on rewardToken
- withdrawRewardToken (onlyOwner)
- updateEpoch price calculation logic
- claimReward happy path (EIP-191 signing aligned with on-chain implementation)
- getClaimable view helper
- Reverts for invalid signature, epoch mismatch, over-claim, and zero-price scenario
</ai_context>
*/
import { expect } from "chai";
import { Contract, BigNumber, Signer } from "ethers";
import { deployments, ethers, network, upgrades } from "hardhat";
import { RariReward__factory, RariReward } from "../typechain-types";
const ONE = BigNumber.from(1);
const ZERO = BigNumber.from(0);
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
  // On-chain: dataHash = keccak256(abi.encodePacked(address(this), epoch, user, totalPoints));
  // then MessageHashUtils.toEthSignedMessageHash(dataHash) and ECDSA.recover
  const dataHash = ethers.utils.solidityKeccak256(
    ["uint256", "address", "uint256", "address", "uint256"],
    [chainId, rewardAddress, epoch, user, totalPoints]
  );
  const sig = await (backend as any).signMessage(ethers.utils.arrayify(dataHash));
  return sig;
}
describe("RariReward", function () {
  before(async () => {
    chainId = (await ethers.provider.getNetwork()).chainId;
  });
  async function deployFixture() {
    const [owner, backend, swapper, user, other] = await ethers.getSigners();
    // Deploy contracts
    const RariReward = await ethers.getContractFactory("RariReward") as RariReward__factory;
    const reward = await upgrades.deployProxy(
      RariReward, // Contract factory
      [owner.address], // Arguments for the initializer function
      {
        initializer: "initialize", // Name of the initializer function
        kind: "transparent", // Specify transparent proxy
      }
    );
    const TestERC20 = await ethers.getContractFactory("TestERC20");
    const rari: Contract = await TestERC20.deploy("RARI", "RARI");
    await rari.deployed();
    const feeToken: Contract = await TestERC20.deploy("FEE", "FEE");
    await feeToken.deployed();
    // Roles
    const EPOCH_ROLE = await reward.EPOCH_ROLE();
    const SWAP_ROLE = await reward.SWAP_ROLE();
    await (await reward.grantRole(EPOCH_ROLE, backend.address)).wait();
    await (await reward.grantRole(SWAP_ROLE, swapper.address)).wait();
    // Set reward token
    await (await reward.connect(owner).setRewardToken(rari.address)).wait();
    return {
      owner,
      backend,
      swapper,
      user,
      other,
      reward,
      rari,
      feeToken,
      EPOCH_ROLE,
      SWAP_ROLE,
    };
  }
  it("initializes and assigns roles properly", async () => {
    const fixture = await deployFixture();
    // Admin is owner
    const DEFAULT_ADMIN_ROLE = await fixture.reward.DEFAULT_ADMIN_ROLE();
    expect(await fixture.reward.hasRole(DEFAULT_ADMIN_ROLE, fixture.owner.address)).to.eq(true);
    // Roles granted
    expect(await fixture.reward.hasRole(fixture.EPOCH_ROLE, fixture.backend.address)).to.eq(true);
    expect(await fixture.reward.hasRole(fixture.SWAP_ROLE, fixture.swapper.address)).to.eq(true);
    // Reward token set
    expect(await fixture.reward.rewardToken()).to.eq(fixture.rari.address);
  });
  it("withdrawFees: ETH by SWAP_ROLE; cannot withdraw reward token", async () => {
    const { owner, swapper, reward, rari, feeToken } = await deployFixture();
    // seed contract with ETH
    await owner.sendTransaction({ to: reward.address, value: toWei("1.0") });
    const contractEthBefore = await ethers.provider.getBalance(reward.address);
    // swapper withdraws 0.4 ETH
    const amount = toWei("0.4");
    await expect(reward.connect(swapper).withdrawFees(ethers.constants.AddressZero, amount, swapper.address))
      .to.emit(reward, "FeeWithdrawn")
      .withArgs(swapper.address, ethers.constants.AddressZero, amount, swapper.address);
    const contractEthAfter = await ethers.provider.getBalance(reward.address);
    expect(contractEthBefore.sub(contractEthAfter)).to.eq(amount);
    // seed contract with an ERC20 fee token
    const ercAmount = toUnits("1000");
    await (await feeToken.mint(reward.address, ercAmount)).wait();
    // swapper withdraws ERC20 fee token
    await expect(reward.connect(swapper).withdrawFees(feeToken.address, toUnits("300"), owner.address))
      .to.emit(reward, "FeeWithdrawn")
      .withArgs(swapper.address, feeToken.address, toUnits("300"), owner.address);
    expect(await feeToken.balanceOf(owner.address)).to.eq(toUnits("300"));
    // cannot withdraw the reward token
    await (await rari.mint(reward.address, toUnits("10"))).wait();
    await expect(
      reward.connect(swapper).withdrawFees(rari.address, toUnits("1"), swapper.address)
    ).to.be.revertedWith("Cannot withdraw reward token");
  });
  it("withdrawRewardToken: owner only", async () => {
    const { owner, swapper, reward, rari } = await deployFixture();
    await (await rari.mint(reward.address, toUnits("50"))).wait();
    // non-owner cannot withdraw reward token
    await expect(
      reward.connect(swapper).withdrawRewardToken(toUnits("1"), swapper.address)
    ).to.be.revertedWithCustomError(reward, "OwnableUnauthorizedAccount").withArgs(swapper.address);
    // owner can withdraw reward token
    await expect(reward.connect(owner).withdrawRewardToken(toUnits("5"), owner.address))
      .to.emit(reward, "RewardTokenWithdrawn")
      .withArgs(toUnits("5"), owner.address);
    expect(await rari.balanceOf(owner.address)).to.eq(toUnits("5"));
  });
  it("updateEpoch sets price correctly from RARI balance and remaining points", async () => {
    const { backend, reward, rari } = await deployFixture();
    // Seed RARI
    await (await rari.mint(reward.address, toUnits("1000"))).wait();
    // newTotalPoints = 5000; totalConvertedPoints = 0 => pointsToReward = 5000
    const newTotalPoints = BigNumber.from(5000);
    const tx = await reward.connect(backend).updateEpoch(newTotalPoints);
    await expect(tx).to.emit(reward, "EpochUpdated");
    const epochIndex = await reward.epochIndex();
    const totalAllocatedPoints = await reward.totalAllocatedPoints();
    const price = await reward.price();
    expect(epochIndex).to.eq(1);
    expect(totalAllocatedPoints).to.eq(newTotalPoints);
    const expectedPrice = toUnits("1000").mul(PRICE_SCALE).div(newTotalPoints);
    expect(price).to.eq(expectedPrice);
  });
  it("claimReward happy path and getClaimable reflect deltas", async () => {
    const { owner, backend, user, reward, rari } = await deployFixture();
    // Seed RARI and update epoch
    await (await rari.mint(reward.address, toUnits("1000"))).wait();
    const newTotalPoints = BigNumber.from(5000);
    await (await reward.connect(backend).updateEpoch(newTotalPoints)).wait();
    const epoch = await reward.epochIndex(); // 1
    const price = await reward.price();
    // Backend signs user's cumulative points = 300
    const totalPoints = BigNumber.from(300);
    const signature = await signClaim(backend, reward.address, epoch, user.address, totalPoints);
    // User claims 250 points now
    const pointsToClaim = BigNumber.from(250);
    const expectedReward = pointsToClaim.mul(price).div(PRICE_SCALE);
    const userBalBefore = await rari.balanceOf(user.address);
    await expect(reward.connect(user).claimReward(pointsToClaim, totalPoints, epoch, signature))
      .to.emit(reward, "RewardClaimed")
      .withArgs(user.address, epoch, pointsToClaim, expectedReward);
    const userBalAfter = await rari.balanceOf(user.address);
    expect(userBalAfter.sub(userBalBefore)).to.eq(expectedReward);
    // State updated
    expect(await reward.claimedPoints(user.address)).to.eq(pointsToClaim);
    expect(await reward.totalConvertedPoints()).to.eq(pointsToClaim);
    // getClaimable reflects remaining delta: 300 - 250 = 50
    const res = await reward.getClaimable(user.address, epoch, totalPoints);
    expect(res.claimablePoints).to.eq(50);
    expect(res.claimableAmount).to.eq(BigNumber.from(50).mul(price).div(PRICE_SCALE));
  });
  it("claimReward: invalid signature reverts", async () => {
    const { backend, other, user, reward, rari } = await deployFixture();
    await (await rari.mint(reward.address, toUnits("1000"))).wait();
    await (await reward.connect(backend).updateEpoch(5000)).wait();
    const epoch = await reward.epochIndex();
    const totalPoints = BigNumber.from(300);
    // signature from an address that does NOT have EPOCH_ROLE
    const badSig = await signClaim(other, reward.address, epoch, user.address, totalPoints);
    await expect(
      reward.connect(user).claimReward(100, totalPoints, epoch, badSig)
    ).to.be.revertedWith("Invalid signature");
  });
  it("claimReward: epoch mismatch reverts", async () => {
    const { backend, user, reward, rari } = await deployFixture();
    await (await rari.mint(reward.address, toUnits("1000"))).wait();
    await (await reward.connect(backend).updateEpoch(5000)).wait();
    const epoch = await reward.epochIndex(); // 1
    const totalPoints = BigNumber.from(300);
    const signature = await signClaim(backend, reward.address, epoch, user.address, totalPoints);
    // Try claiming for epoch 0 (mismatch)
    await expect(
      reward.connect(user).claimReward(100, totalPoints, 0, signature)
    ).to.be.revertedWith("Epoch mismatch");
  });
  it("claimReward: over-claiming beyond delta reverts", async () => {
    const { backend, user, reward, rari } = await deployFixture();
    await (await rari.mint(reward.address, toUnits("1000"))).wait();
    await (await reward.connect(backend).updateEpoch(5000)).wait();
    const epoch = await reward.epochIndex(); // 1
    const totalPoints = BigNumber.from(300);
    const signature = await signClaim(backend, reward.address, epoch, user.address, totalPoints);
    // First claim 200
    await (await reward.connect(user).claimReward(200, totalPoints, epoch, signature)).wait();
    // Remaining delta is 100; try to claim 150 -> revert
    await expect(
      reward.connect(user).claimReward(150, totalPoints, epoch, signature)
    ).to.be.revertedWith("Points to claim must be less than or equal to delta");
  });
  it("updateEpoch with zero RARI balance sets price=0; claim reverts with 'No reward available'", async () => {
    const { backend, user, reward } = await deployFixture();
    // No RARI minted => rariBalance=0
    await (await reward.connect(backend).updateEpoch(1000)).wait();
    const epoch = await reward.epochIndex();
    const totalPoints = BigNumber.from(100);
    // Sign with backend (valid signer)
    const signature = await signClaim(backend, reward.address, epoch, user.address, totalPoints);
    await expect(
      reward.connect(user).claimReward(50, totalPoints, epoch, signature)
    ).to.be.revertedWith("No reward available");
  });
});