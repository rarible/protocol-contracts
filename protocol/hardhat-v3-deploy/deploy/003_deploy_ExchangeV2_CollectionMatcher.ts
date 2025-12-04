// we import what we need from the @rocketh alias, see ../rocketh.ts
import {deployScript, artifacts} from '#rocketh';
import { ERC721_LAZY, ERC1155_LAZY, COLLECTION, getConfig, ROYALTIES_REGISTRY_TYPE } from '../sdk/utils.js';

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

// Helper to create a deployment object with address and abi
function createDeployment(address: string, artifact: any) {
	return {
		address,
		abi: artifact.abi,
	};
}

export default deployScript(
	async ({deployViaProxy, deploy, execute, get, namedAccounts, network}) => {
		const {deployer} = namedAccounts;

		console.log('deployer', deployer);

		// Get deployed transfer proxies
		const transferProxyDeployment = await get('TransferProxy');
		const erc20TransferProxyDeployment = await get('ERC20TransferProxy');
		const erc721LazyMintTransferProxyDeployment = await get('ERC721LazyMintTransferProxy');
		const erc1155LazyMintTransferProxyDeployment = await get('ERC1155LazyMintTransferProxy');
		const royaltiesRegistryDeployment = await get(ROYALTIES_REGISTRY_TYPE);

		const { deploy_meta, deploy_non_meta } = getConfig(network.chain.name);

		// Deploy ExchangeV2 with meta support if needed
		if (deploy_meta) {
			await deployAndSetupExchange({
				contractName: 'ExchangeMetaV2',
				deployViaProxy,
				deploy,
				execute,
				deployer,
				transferProxyAddress: transferProxyDeployment.address,
				erc20TransferProxyAddress: erc20TransferProxyDeployment.address,
				erc721LazyMintTransferProxyAddress: erc721LazyMintTransferProxyDeployment.address,
				erc1155LazyMintTransferProxyAddress: erc1155LazyMintTransferProxyDeployment.address,
				royaltiesRegistryAddress: royaltiesRegistryDeployment.address,
			});
		}

		if (deploy_non_meta) {
			await deployAndSetupExchange({
				contractName: 'ExchangeV2',
				deployViaProxy,
				deploy,
				execute,
				deployer,
				transferProxyAddress: transferProxyDeployment.address,
				erc20TransferProxyAddress: erc20TransferProxyDeployment.address,
				erc721LazyMintTransferProxyAddress: erc721LazyMintTransferProxyDeployment.address,
				erc1155LazyMintTransferProxyAddress: erc1155LazyMintTransferProxyDeployment.address,
				royaltiesRegistryAddress: royaltiesRegistryDeployment.address,
			});
		}
	},
	{tags: ['all', 'all-no-tokens', 'all-with-sanity-check', 'deploy-exchange', '003'], dependencies: ['001', '002']},
);

interface DeployExchangeParams {
	contractName: string;
	deployViaProxy: any;
	deploy: any;
	execute: any;
	deployer: string;
	transferProxyAddress: string;
	erc20TransferProxyAddress: string;
	erc721LazyMintTransferProxyAddress: string;
	erc1155LazyMintTransferProxyAddress: string;
	royaltiesRegistryAddress: string;
}

async function deployAndSetupExchange({
	contractName,
	deployViaProxy,
	deploy,
	execute,
	deployer,
	transferProxyAddress,
	erc20TransferProxyAddress,
	erc721LazyMintTransferProxyAddress,
	erc1155LazyMintTransferProxyAddress,
	royaltiesRegistryAddress,
}: DeployExchangeParams) {
	// Deploy ExchangeV2 via proxy
	const exchangeV2Deployment = await deployViaProxy(
		contractName,
		{
			account: deployer,
			artifact: artifacts.ExchangeV2,
			args: [],
		},
		{
			owner: deployer,
			linkedData: {
				deployer,
			},
			execute: {
				methodName: '__ExchangeV2_init',
				args: [
					transferProxyAddress,
					erc20TransferProxyAddress,
					0,
					deployer,
					royaltiesRegistryAddress,
					deployer,
				],
			},
			proxyContract: 'SharedAdminOptimizedTransparentProxy',
			deterministic: false,
		}
	);

	// Create deployment objects with address and abi for execute calls
	const transferProxyWithAbi = createDeployment(transferProxyAddress, artifacts.TransferProxy);
	const erc20TransferProxyWithAbi = createDeployment(erc20TransferProxyAddress, artifacts.ERC20TransferProxy);
	const erc721LazyMintTransferProxyWithAbi = createDeployment(erc721LazyMintTransferProxyAddress, artifacts.ERC721LazyMintTransferProxy);
	const erc1155LazyMintTransferProxyWithAbi = createDeployment(erc1155LazyMintTransferProxyAddress, artifacts.ERC1155LazyMintTransferProxy);
	const exchangeV2WithAbi = createDeployment(exchangeV2Deployment.address, artifacts.ExchangeV2);

	// Add exchangeV2 as operator to all 4 transfer proxies
	// Using execute with deployment object (not string name) to include abi
	console.log('Adding exchangeV2 as operator to all 4 transfer proxies');
	await execute(transferProxyWithAbi, {
		account: deployer,
		functionName: 'addOperator',
		args: [exchangeV2Deployment.address],
	});
	await execute(erc20TransferProxyWithAbi, {
		account: deployer,
		functionName: 'addOperator',
		args: [exchangeV2Deployment.address],
	});
	await execute(erc721LazyMintTransferProxyWithAbi, {
		account: deployer,
		functionName: 'addOperator',
		args: [exchangeV2Deployment.address],
	});
	await execute(erc1155LazyMintTransferProxyWithAbi, {
		account: deployer,
		functionName: 'addOperator',
		args: [exchangeV2Deployment.address],
	});

	// Set 2 lazy transfer proxies in exchangeV2 contract (other 2 are set in initialiser)
	console.log('Setting 2 lazy transfer proxies in exchangeV2 contract');
	await execute(exchangeV2WithAbi, {
		account: deployer,
		functionName: 'setTransferProxy',
		args: [ERC721_LAZY, erc721LazyMintTransferProxyAddress],
	});
	await execute(exchangeV2WithAbi, {
		account: deployer,
		functionName: 'setTransferProxy',
		args: [ERC1155_LAZY, erc1155LazyMintTransferProxyAddress],
	});

	// Deploy and setup collection matcher (no proxy needed)
	console.log('Deploying and setting collection matcher');
	const assetMatcherCollectionDeployment = await deploy('AssetMatcherCollection', {
		account: deployer,
		artifact: artifacts.AssetMatcherCollection,
		args: [],
		linkedData: {
			deployer,
		},
	});

	await execute(exchangeV2WithAbi, {
		account: deployer,
		functionName: 'setAssetMatcher',
		args: [COLLECTION, assetMatcherCollectionDeployment.address],
	});
}
