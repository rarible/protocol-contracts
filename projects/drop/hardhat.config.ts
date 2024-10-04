import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "hardhat-deploy"

const config: HardhatUserConfig = {
	paths: {
		sources: "./contracts",
	},
	solidity: {
		version: "0.8.17",
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	networks: {
		sepolia: {
			url: "http://127.0.0.1:1248",
			chainId: 11155111,
			timeout: 60000,
		}
	},
	namedAccounts: {
		deployer: 0,
	},
}

export default config