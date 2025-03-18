import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

async function main(hre: HardhatRuntimeEnvironment) {
  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();

  const signer = await hre.ethers.getSigner(deployer);
  const signers = await hre.ethers.getSigners();
  const makerRight = signers[1];
  console.log("Deployer address =>", signer.address);

  // 1) Deploy a simple ERC20 contract named "RariTest"
  // If you already have a test ERC20, you may skip, 
  // or adapt the contract name as needed:
  const deployResult = await deploy("RariTestERC20", {
    from: deployer,
    // Pass constructor arguments if your ERC20 contract requires them
    args: ["RariTest", "RRT", 18, signer.address],
    log: true,
    autoMine: true,
  });

  console.log(`RariTestERC20 deployed to: ${deployResult.address}`);

  // 2) Mint tokens (assuming the contract has a 'mint' function)
  // If your ERC20 contract is just standard, you might have 'mint(to, amount)'
  // If using OpenZeppelin's ERC20PresetMinterPauser, it has 'mint(receiver, amount)'

  const RariTestERC20 = await hre.ethers.getContractFactory("RariTestERC20");
  const rariTestERC20 = RariTestERC20.attach(deployResult.address).connect(signer);

  // Mint 10,000 RRT tokens to the deployer 
  //  (18 decimals => 10000 * 10^18)
  const decimals = 18;
  const mintedAmount = ethers.utils.parseUnits("10000", decimals); 
  const mintTx = await rariTestERC20.mint(signer.address, mintedAmount);
  await mintTx.wait();

  const mintTxRight = await rariTestERC20.mint(makerRight.address, mintedAmount);
  await mintTxRight.wait();
  console.log(`Minted ${mintedAmount.toString()} tokens to ${signer.address}`);
  console.log(`Minted ${mintedAmount.toString()} tokens to ${makerRight.address}`);
  // Check the balance
  const balance = await rariTestERC20.balanceOf(signer.address);
  console.log(`Balance of deployer => ${balance.toString()}`);
  const balanceRight = await rariTestERC20.balanceOf(makerRight.address);
  console.log(`Balance of makerRight => ${balanceRight.toString()}`);
  console.log("Done!");
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  await main(hre);
};

export default func;
func.tags = ["deploy-erc20", "208"];