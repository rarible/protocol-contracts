const contract = require("@truffle/contract");
const adminJson = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json")
const ProxyAdmin = contract(adminJson)
ProxyAdmin.setProvider(web3.currentProvider)

const Locking = artifacts.require("Locking");
const RariMineV3 = artifacts.require("RariMineV3");

const { getAdminProxy } = require("./config.js")

const mainnet = {
	timelock: "0x7e9c956e3EFA81Ace71905Ff0dAEf1A71f42CBC5",
  adminProxyAddress: "0xDc8BaA86f136F8B0851F090a4DfFDc7b5F46688D"
}
const goerli = {
	timelock: "0x1C795d4AEf47BBbf0698471A3b04D51b2BFac893",
  adminProxyAddress: "0x919AEd466F30A821670b12aaab3A4102d8536486"
}
const def = {
	timelock: "0x0000000000000000000000000000000000000000",
  adminProxyAddress: "0x0000000000000000000000000000000000000000"
}

let settings = {
	"default": def,
	"mainnet": mainnet,
	"goerli": goerli,
};

function getSettings(network) {
	if (settings[network] !== undefined) {
		return settings[network];
	} else {
		return settings["default"];
	}
} 

module.exports = async function (deployer, network, accounts) {
  const { timelock, adminProxyAddress } = getSettings(network);

  if (timelock === "0x0000000000000000000000000000000000000000") {
    console.log(`can't make zero address the owner. skipping 29th migration.`)
    return;
  }

  //changing owner of locking to timelock
  const locking = await Locking.deployed();
  await changeOwner(locking, timelock, "locking")

  //changing owner of rariMineV3 to timelock
  const rariMineV3 = await RariMineV3.deployed();
  await changeOwner(rariMineV3, timelock, "rariMineV3")

  //changing Locking and RariMineV3 proxyAdmin address
  //setting proxyAdmin that owned by governance

  const admin = await ProxyAdmin.at(getAdminProxy(network))

  await changeAdminProxy(accounts[0], admin, locking, adminProxyAddress, "locking")
  await changeAdminProxy(accounts[0], admin, rariMineV3, adminProxyAddress, "rariMineV3" )

};

async function changeOwner(contract, newOwner, contractName) {
  const oldOwner = await contract.owner();
  await contract.transferOwnership(newOwner)
  console.log(`for contract ${contractName} at ${contract.address} changed owner from ${oldOwner} to ${await contract.owner()}`)
}

async function changeAdminProxy(from, admin, contract, newAdmin, contractName) {
  const oldAdmin = await admin.getProxyAdmin(contract.address)
  await admin.changeProxyAdmin(contract.address, newAdmin, {from: from})
  const newAdminContract = await ProxyAdmin.at(newAdmin)
  console.log(`for contract ${contractName} at ${contract.address} changed ProxyAdmin address from ${oldAdmin} to ${await newAdminContract.getProxyAdmin(contract.address)}`)
}

