const TransferProxy = artifacts.require('TransferProxy');
const ERC721LazyMintTransferProxy = artifacts.require('ERC721LazyMintTransferProxy');
const ERC1155LazyMintTransferProxy = artifacts.require('ERC1155LazyMintTransferProxy');
const ERC20TransferProxy = artifacts.require('ERC20TransferProxy');
const ExchangeV2 = artifacts.require('ExchangeV2');

const ExchangeMetaV2 = artifacts.require('ExchangeMetaV2');

const { ERC721_LAZY, ERC1155_LAZY, getSettings } = require("./config.js")

module.exports = async function (deployer, network) {

  const { deploy_meta, deploy_non_meta } = getSettings(network);

  if (!!deploy_meta) {
    await setTransferProxies(await ExchangeMetaV2.deployed());
  } 
  
  if (!!deploy_non_meta){
    await setTransferProxies(await ExchangeV2.deployed());
  }

};

async function setTransferProxies(exchangeV2) {
  //add exchangeV2 as operator to proxies
  const transferProxy = await TransferProxy.deployed();
  await transferProxy.addOperator(exchangeV2.address)

  const erc721LazyMintTransferProxy = await ERC721LazyMintTransferProxy.deployed();
  await erc721LazyMintTransferProxy.addOperator(exchangeV2.address)
  await exchangeV2.setTransferProxy(ERC721_LAZY, erc721LazyMintTransferProxy.address)

  const erc1155LazyMintTransferProxy = await ERC1155LazyMintTransferProxy.deployed();
  await erc1155LazyMintTransferProxy.addOperator(exchangeV2.address)
  await exchangeV2.setTransferProxy(ERC1155_LAZY, erc1155LazyMintTransferProxy.address)

  const erc20TransferProxy = await ERC20TransferProxy.deployed();
  await erc20TransferProxy.addOperator(exchangeV2.address)
}

