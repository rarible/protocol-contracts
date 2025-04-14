import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import {DropERC721Reader, DropERC721Reader__factory } from "@rarible/thirdweb-query";
//import { ProxyAdmin, ProxyAdmin__factory } from "../typechain-types";
import { DefaultProxyAdmin__factory } from "../typechain-types";
// import {TransparentUpgradeableProxy__factory} from "../typechain-types/@openzeppelin/contracts-sol08/proxy/transparent/TransparentUpgradeableProxy.sol";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  console.log(`deploying contracts on network ${hre.network.name}`);

  const { deploy } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  const owner = deployer;
  console.log("deploying contracts with the account:", deployer);

  await deploy('DropERC721Reader', {
    from: deployer,
    proxy: {
        execute: {
            init: {
            methodName: "initialize",
            args: ["0x0000000000000000000000000000000000000000", "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", owner],
            },
        },
        proxyContract: "OpenZeppelinTransparentProxy",
        viaAdminContract: {
        name: "ReaderProxyAdmin",
        artifact: {
            abi: DefaultProxyAdmin__factory.abi as any,
            bytecode: DefaultProxyAdmin__factory.bytecode,
        },
        
      },
      checkABIConflict: false,
    },
    log: true,
    autoMine: true,
    args: [],
    deterministicDeployment: process.env.DETERMENISTIC_DEPLOYMENT_SALT,
    skipIfAlreadyDeployed: process.env.SKIP_IF_ALREADY_DEPLOYED ? true: false,
    contract: {
      abi: DropERC721Reader__factory.abi as any,
      bytecode: DropERC721Reader__factory.bytecode,
    },
  });
};

export default func;
func.tags = ['all', "1001", "thirdweb-query"];