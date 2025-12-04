// we import what we need from the @rocketh alias, see ../rocketh.ts
import {deployScript, artifacts} from '#rocketh';

export default deployScript(
	// this allow us to define a functiong which takes as first argument an environment object
	async ({deployViaProxy, namedAccounts}) => {
		// you can get named accounts from the environment object
		const {deployer} = namedAccounts;

		console.log('deployer', deployer);

		// Deploy via proxy
		// Note: @rocketh/proxy hardcodes deterministic: true for implementation
		// For verification, use: npx hardhat verify --network <network> <impl_address>
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
		);
	},
	// finally you can pass tags and dependencies
	{tags: ['all', 'deploy-rr', '001']},
);
