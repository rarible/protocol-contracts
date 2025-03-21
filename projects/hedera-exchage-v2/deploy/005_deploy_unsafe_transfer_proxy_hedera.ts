import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  //deploy and initialise 4 transfer proxies

  await deployAndInitProxy(hre, "UnsafeTransferProxyHedera")
 

};

async function deployAndInitProxy(hre: HardhatRuntimeEnvironment, contractName: string) {
  console.log(`Deploying ${contractName}...`)
  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();

  const transferProxyReceipt = await deploy(contractName, {
    from: deployer,
    log: true,
    autoMine: true,
    gasLimit: 8_000_000,
  });

  const Proxy = await hre.ethers.getContractFactory(contractName);
  const proxy = await Proxy.attach(transferProxyReceipt.address);

  const initTx = await proxy.__OperatorRole_init({gasLimit: 8_000_000});
  await initTx.wait()

  return proxy;
}

export default func;
func.tags = ['all', 'all-no-tokens', 'deploy-transfer-proxies', '005'];
