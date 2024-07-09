/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
  },
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
};