import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  console.log(`deploying contracts on network ${hre.network.name}`)

  const { deploy } = hre.deployments;
  const { getNamedAccounts} = hre;
  const { deployer } = await getNamedAccounts();
  const sg = (await hre.ethers.getSigner(deployer))
  const signer =await (await hre.ethers.getSigner(deployer)).getAddress()
  console.log("signer signer signer:", signer);
  console.log("deploying contracts with the account:", deployer);

  await deploy('RoyaltiesRegistry', {
    from: deployer,
    proxy: {
      execute: {
        init: {
          methodName: "__RoyaltiesRegistry_init",
          args: [],
        },
      },
      proxyContract: "OpenZeppelinTransparentProxy",
    },
    log: true,
    autoMine: true,
  });

};
export default func;
func.tags = ['all', "1"];
