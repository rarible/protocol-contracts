import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { transferSingleContractOwnership, transferTimelockAdminRole, renounceTimelockAdminRole} from "../tasks/transfer-ownership";
import { getContractsAddressesToMigrate } from "../utils/config";

import { getSigner } from "../utils/get-signer";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const settings = await getContractsAddressesToMigrate();

  const signer = await getSigner(hre);

  const contractAddress = settings.ERC20TransferProxy;
  const oldOwner = signer.address;
  const newOwner = (await hre.deployments.get("UpgradeExecutor")).address;

  console.log(`Transfering ownership of contract: ERC20TransferProxy, at:${contractAddress}`)
  console.log(`oldOwner=${oldOwner}, newOwner=${newOwner}`)

  await transferSingleContractOwnership(contractAddress, newOwner, signer)

  console.log()
};
export default func;
func.tags = ['ownership-transfer', 'ERC20TransferProxy'];
