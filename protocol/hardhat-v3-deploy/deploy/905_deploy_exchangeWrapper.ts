// we import what we need from the @rocketh alias, see ../rocketh.ts
import {deployScript, artifacts} from '#rocketh';
import { getConfig } from '../sdk/utils.js';

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

// Network-specific marketplace configurations
const mainnet = {
	marketplaces: [
		'0x7f268357A8c2552623316e2562D90e642bB538E5', // wyvernExchange
		'', // rarible exchangeV2 placeholder
		'0x00000000006c3852cbEf3e08E8dF289169EdE581', // seaPort_1_1
		'0x74312363e45DCaBA76c59ec49a7Aa8A65a67EeD3', // x2y2
		'0x59728544B08AB483533076417FbBB2fD0B17CE3a', // looksRare
		'0x2b2e8cda09bba9660dca5cb6233787738ad68329', // sudoSwap
		'0x00000000000001ad428e4906aE43D8F9852d0dD6', // seaport_1_4
		'0x0000000000e655fae4d56241588680f86e3b2377', // looksRareV2
		'0x000000000000Ad05Ccc4F10045630fb830B95127', // blur
		'0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC', // seaport_1_5
		'0x0000000000000068F116a894984e2DB1123eB395', // seaport_1_6
	],
	weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
	transferProxies: [] as string[],
};

const polygon_mainnet = {
	marketplaces: [
		ADDRESS_ZERO, // wyvernExchange
		'', // rarible exchangeV2 placeholder
		'0x00000000006c3852cbef3e08e8df289169ede581', // seaPort_1_1
		ADDRESS_ZERO, // x2y2
		ADDRESS_ZERO, // looksRare
		ADDRESS_ZERO, // sudoSwap
		'0x00000000000001ad428e4906aE43D8F9852d0dD6', // seaport_1_4
		ADDRESS_ZERO, // looksRareV2
		ADDRESS_ZERO, // blur
		'0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC', // seaport_1_5
		'0x0000000000000068F116a894984e2DB1123eB395', // seaport_1_6
	],
	weth: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
	transferProxies: [] as string[],
};

const sepolia = {
	marketplaces: [
		ADDRESS_ZERO, // wyvernExchange
		'', // rarible exchangeV2 placeholder
		'0x00000000006c3852cbEf3e08E8dF289169EdE581', // seaPort_1_1
		ADDRESS_ZERO, // x2y2
		'0xD112466471b5438C1ca2D218694200e49d81D047', // looksRare
		'0x25b4EfC43c9dCAe134233CD577fFca7CfAd6748F', // sudoSwap
		'0x00000000000001ad428e4906aE43D8F9852d0dD6', // seaport_1_4
		'0x35C2215F2FFe8917B06454eEEaba189877F200cf', // looksRareV2
		ADDRESS_ZERO, // blur
		'0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC', // seaport_1_5
		'0x0000000000000068F116a894984e2DB1123eB395', // seaport_1_6
	],
	weth: '0x7b79995e5f793a07bc00c21412e50ecae098e7f9',
	transferProxies: [] as string[],
};

const defaultSettings = {
	marketplaces: [
		ADDRESS_ZERO, // wyvernExchange
		'', // rarible exchangeV2 placeholder
		'0x00000000006c3852cbEf3e08E8dF289169EdE581', // seaPort_1_1
		ADDRESS_ZERO, // x2y2
		ADDRESS_ZERO, // looksRare
		ADDRESS_ZERO, // sudoSwap
		'0x00000000000001ad428e4906aE43D8F9852d0dD6', // seaport_1_4
		ADDRESS_ZERO, // looksRareV2
		ADDRESS_ZERO, // blur
		'0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC', // seaport_1_5
		'0x0000000000000068F116a894984e2DB1123eB395', // seaport_1_6
	],
	weth: ADDRESS_ZERO,
	transferProxies: [] as string[],
};

const networkSettings: Record<string, typeof defaultSettings> = {
	mainnet,
	'mainnet-fork': mainnet,
	sepolia,
	polygon_mainnet,
	Sepolia: sepolia,
};

function getWrapperSettings(networkName: string) {
	return networkSettings[networkName] ?? defaultSettings;
}

export default deployScript(
	async ({deploy, get, namedAccounts, network}) => {
		const {deployer} = namedAccounts;

		console.log('deployer', deployer);

		const { deploy_meta, deploy_non_meta } = getConfig(network.chain.name);

		// Get exchange address based on deployment type
		let exchangeV2Address: string;
		if (deploy_meta) {
			const exchangeMetaV2 = await get('ExchangeMetaV2');
			exchangeV2Address = exchangeMetaV2.address;
		} else if (deploy_non_meta) {
			const exchangeV2 = await get('ExchangeV2');
			exchangeV2Address = exchangeV2.address;
		} else {
			throw new Error('No exchange deployment configured for this network');
		}

		// Get settings for this network
		const settings = getWrapperSettings(network.chain.name);
		
		// Set rarible exchange address in marketplaces array
		const marketplaces = [...settings.marketplaces];
		marketplaces[1] = exchangeV2Address;

		if (settings.weth === ADDRESS_ZERO) {
			console.log('Using zero address WETH for exchangeWrapper');
		}

		// Get ERC20TransferProxy address
		const erc20TransferProxy = await get('ERC20TransferProxy');
		const transferProxies = [erc20TransferProxy.address];

		// Deploy RaribleExchangeWrapper
		await deploy('RaribleExchangeWrapper', {
			account: deployer,
			artifact: artifacts.RaribleExchangeWrapper,
			args: [marketplaces, settings.weth, transferProxies, deployer],
			linkedData: {
				deployer,
			},
		});
	},
	{tags: ['all', 'all-zk', 'wrapper', 'all-no-tokens', 'all-zk-no-tokens', '905']},
);
