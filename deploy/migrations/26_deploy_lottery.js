const TestERC721 = artifacts.require('TestERC721');
const NFTLottery = artifacts.require('NFTLottery');


module.exports = async function (deployer, network) {
  await deployer.deploy(TestERC721, { gas: 2500000 });
  const testerc721 = await TestERC721.deployed();

  console.log("test erc721 deployed on", network, "at:", testerc721.address)

  await deployer.deploy(NFTLottery, {gas: 3500000})
  const lottery = await NFTLottery.deployed()
  console.log("NFTLottery deployed on", network, "at:", lottery.address)

};