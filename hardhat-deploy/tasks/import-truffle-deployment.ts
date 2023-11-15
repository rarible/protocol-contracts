import { task } from 'hardhat/config';
import fs from 'fs/promises';
import path from 'path';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeploymentsExtension } from 'hardhat-deploy/types';
import "hardhat-deploy";


task(
  'import-truffle-deployments',
  'Saves Truffle deployments to Hardhat. Use --network to choose the deployments path to save to'
)
  .addParam('artifacts', 'Artifacts path to export from')
  .setAction(
    async (
      taskArgs: { artifacts: string },
      hre: HardhatRuntimeEnvironment
    ) => {
      const { deployments, network } = hre;
      const { log, save, getExtendedArtifact } = deployments as DeploymentsExtension;

      const chainId = network.config.chainId!;
      const ARTIFACTS_PATH = path.resolve(taskArgs.artifacts);
      const artifacts = await fs.readdir(ARTIFACTS_PATH);

      const truffleDeployedAddresses = await Promise.all(
        artifacts.map(async (artifactPath) => {
          const file = await import(ARTIFACTS_PATH + '/' + artifactPath);
          const address = file.networks[chainId]?.address;
          if (address) return [file.contractName, address];
          else return [];
        })
      ).then((result) => result.filter((p) => p.length !== 0));

      await Promise.all(
        truffleDeployedAddresses.map(async ([name, address]) => {
          await save(name, {
            address,
            ...(await getExtendedArtifact(name))
          });
        })
      );

      console.log(`Done! Exported ${truffleDeployedAddresses.length} deployed contracts`);
    }
  );

export default {}; // This export is necessary to satisfy TypeScript's module system
