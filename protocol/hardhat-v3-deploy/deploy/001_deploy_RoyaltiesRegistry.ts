// we import what we need from the @rocketh alias, see ../rocketh.ts
import {deployScript, artifacts} from '#rocketh';

export default deployScript(
	// this allow us to define a functiong which takes as first argument an environment object
	async ({deployViaProxy, namedAccounts}) => {
		// you can get named accounts from the environment object
		const {deployer} = namedAccounts;

  console.log('deployer', deployer);
		// you can use the deployViaProxy function to deploy a contract via a proxy
		// see `import "@rocketh/proxy"` in ../rocketh.ts
		await deployViaProxy(
			'RoyaltiesRegistry',
			{
				account: deployer,
				artifact: artifacts.RoyaltiesRegistry,
				args: [],
			},
      {
				owner: deployer,
				linkedData: {
					deployer,
				},
        execute: {
          methodName: "__RoyaltiesRegistry_init",
          args: [],
        },
        proxyContract: "SharedAdminOptimizedTransparentProxy",
			},
      {deterministicDeployment: false}
		);
	},
	// finally you can pass tags and dependencies
	{tags: ['all', 'deploy-rr', '001']},
);
