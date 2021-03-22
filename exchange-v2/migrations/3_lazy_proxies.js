const ERC721LazyMintTransferProxy = artifacts.require("ERC721LazyMintTransferProxy");
const ERC1155LazyMintTransferProxy = artifacts.require("ERC1155LazyMintTransferProxy");
const ExchangeV2 = artifacts.require('ExchangeV2');

module.exports = async function (deployer) {
  await deployer.deploy(ERC721LazyMintTransferProxy, { gas: 1000000 });
  const erc721p = await ERC721LazyMintTransferProxy.deployed();
  await erc721p.__OperatorRole_init();

  await deployer.deploy(ERC1155LazyMintTransferProxy, { gas: 1000000 });
  const erc1155p = await ERC1155LazyMintTransferProxy.deployed();
  await erc1155p.__OperatorRole_init();

  const ex = await ExchangeV2.deployed();
  await erc721p.addOperator(ex.address);
  await erc1155p.addOperator(ex.address);
  await ex.setTransferProxy("0xd8f960c1", erc721p.address);
  await ex.setTransferProxy("0x1cdfaa40", erc1155p.address);
};
