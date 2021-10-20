const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const AuctionHouse = artifacts.require('AuctionHouse');
const Wrapper = artifacts.require('Wrapper');

const e2e = {
  communityWallet: "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4",
  erc20TransferProxy: "0xbf558e78cfde95afbf17a4abe394cb2cc42e6270",
  transferProxy: "0x66611f8d97688a0af08d4337d7846efec6995d58",
};

const mainnet = {
  communityWallet: "0x1cf0df2a5a20cd61d68d4489eebbf85b8d39e18a",
  erc20TransferProxy: "0xb8e4526e0da700e9ef1f879af713d691f81507d8",
  transferProxy: "0x4fee7b061c97c9c496b01dbce9cdb10c02f0a0be",
};

const ropsten = {
  communityWallet: "0xe627243104a101ca59a2c629adbcd63a782e837f",
  erc20TransferProxy: "0xa5a51d7b4933185da9c932e5375187f661cb0c69",
  transferProxy: "0xf8e4ecac18b65fd04569ff1f0d561f74effaa206",
};

const rinkeby = {
  communityWallet: "0xe627243104a101ca59a2c629adbcd63a782e837f",
  erc20TransferProxy: "0x2fce8435f0455edc702199741411dbcd1b7606ca",
  transferProxy: "0x7d47126a2600e22eab9ed6cf0e515678727779a6",
};

let settings = {
  "default": e2e,
  "e2e": e2e,
  "e2e-fork": e2e,
  "ropsten": ropsten,
  "ropsten-fork": ropsten,
  "rinkeby": rinkeby,
  "rinkeby-fork": rinkeby,
  "mainnet": mainnet,
  "mainnet-fork": mainnet
};

function getSettings(network) {
  if (settings[network] !== undefined) {
    return settings[network];
  } else {
    return settings["default"];
  }
}

module.exports = async function (deployer, network) {
  const { communityWallet, erc20TransferProxy, transferProxy } = getSettings(network);

  const auction = await deployProxy(
    AuctionHouse,
    [transferProxy, erc20TransferProxy, 0, communityWallet],
    { deployer, initializer: '__AuctionHouse_init' }
  );
  console.log(`deployed auction at ${auction.address}`)

  await deployer.deploy(Wrapper, auction.address);
  const wrapper = await Wrapper.deployed();
  console.log(`deployed wrapper at ${wrapper.address}`)
};