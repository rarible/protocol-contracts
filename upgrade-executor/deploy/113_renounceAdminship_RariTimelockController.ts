import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { transferSingleContractOwnership, transferTimelockAdminRole, renounceTimelockAdminRole} from "../tasks/transfer-ownership";
import { getContractsAddressesToMigrate } from "../utils/config";

import { getSigner } from "../utils/get-signer";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const settings = await getContractsAddressesToMigrate();

  const signer = await getSigner(hre);

  const contractAddress = settings.RariTimelockController;
  console.log(`Renouncing adminship of contract: RariTimelockController, at:${contractAddress}`)

  await renounceTimelockAdminRole(settings.RariTimelockController, signer.address, signer)

  console.log()
};
export default func;
func.tags = ['ownership-renouncement', 'RariTimelockController'];
