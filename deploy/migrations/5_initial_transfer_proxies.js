const TransferProxy = artifacts.require('TransferProxy');
const ERC721LazyMintTransferProxy = artifacts.require('ERC721LazyMintTransferProxy');
const ERC1155LazyMintTransferProxy = artifacts.require('ERC1155LazyMintTransferProxy');
const ERC20TransferProxy = artifacts.require('ERC20TransferProxy');

const { getGasMultiplier } = require("./config.js")

module.exports = async function (deployer, network) {
  //erc721 + erc1155
  await deployer.deploy(TransferProxy, { gas: 1500000 * getGasMultiplier(network) });
  const transferProxy = await TransferProxy.deployed();
  await transferProxy.__OperatorRole_init({ gas: 200000 * getGasMultiplier(network) });
  console.log("deployed transferProxy at", transferProxy.address)

  //erc20
  await deployer.deploy(ERC20TransferProxy, { gas: 1500000 * getGasMultiplier(network) });
  const erc20TransferProxy = await ERC20TransferProxy.deployed();
  await erc20TransferProxy.__OperatorRole_init({ gas: 200000 * getGasMultiplier(network) });
  console.log("deployed erc20TransferProxy at", erc20TransferProxy.address)

  //erc721lazy
  await deployer.deploy(ERC721LazyMintTransferProxy, { gas: 1500000 * getGasMultiplier(network) });
  const erc721Proxy = await ERC721LazyMintTransferProxy.deployed();
  await erc721Proxy.__OperatorRole_init({ gas: 200000 * getGasMultiplier(network) });
  console.log("deployed erc721LazyProxy at", erc721Proxy.address)

  //erc1155lazy
  await deployer.deploy(ERC1155LazyMintTransferProxy, { gas: 1500000 * getGasMultiplier(network) });
  const erc1155Proxy = await ERC1155LazyMintTransferProxy.deployed();
  await erc1155Proxy.__OperatorRole_init({ gas: 200000 * getGasMultiplier(network) });
  console.log("deployed erc1155LazyProxy at", erc1155Proxy.address)

};