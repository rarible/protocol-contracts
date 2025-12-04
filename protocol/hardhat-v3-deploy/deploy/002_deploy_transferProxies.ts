// we import what we need from the @rocketh alias, see ../rocketh.ts
import {deployScript, artifacts} from '#rocketh';

export default deployScript(
	// this allow us to define a function which takes as first argument an environment object
	async ({deployViaProxy, namedAccounts}) => {
		// you can get named accounts from the environment object
		const {deployer} = namedAccounts;

		console.log('deployer', deployer);

		// Deploy and initialise 4 transfer proxies
		await deployViaProxy(
			'TransferProxy',
			{
				account: deployer,
				artifact: artifacts.TransferProxy,
				args: [],
			},
			{
				owner: deployer,
				linkedData: {
					deployer,
				},
				execute: {
					methodName: "__TransferProxy_init",
					args: [deployer],
				},
				proxyContract: "SharedAdminOptimizedTransparentProxy",
				deterministic: false,
			},
		);

		await deployViaProxy(
			'ERC20TransferProxy',
			{
				account: deployer,
				artifact: artifacts.ERC20TransferProxy,
				args: [],
			},
			{
				owner: deployer,
				linkedData: {
					deployer,
				},
				execute: {
					methodName: "__ERC20TransferProxy_init",
					args: [deployer],
				},
				proxyContract: "SharedAdminOptimizedTransparentProxy",
				deterministic: false,
			},
		);

		await deployViaProxy(
			'ERC721LazyMintTransferProxy',
			{
				account: deployer,
				artifact: artifacts.ERC721LazyMintTransferProxy,
				args: [],
			},
			{
				owner: deployer,
				linkedData: {
					deployer,
				},
				execute: {
					methodName: "__ERC721LazyMintTransferProxy_init",
					args: [deployer],
				},
				proxyContract: "SharedAdminOptimizedTransparentProxy",
				deterministic: false,
			},
		);

		await deployViaProxy(
			'ERC1155LazyMintTransferProxy',
			{
				account: deployer,
				artifact: artifacts.ERC1155LazyMintTransferProxy,
				args: [],
			},
			{
				owner: deployer,
				linkedData: {
					deployer,
				},
				execute: {
					methodName: "__ERC1155LazyMintTransferProxy_init",
					args: [deployer],
				},
				proxyContract: "SharedAdminOptimizedTransparentProxy",
				deterministic: false,
			},
		);
	},
	// finally you can pass tags and dependencies
	{tags: ['all', 'all-no-tokens', 'all-with-sanity-check', 'deploy-transfer-proxies', '002']},
);
