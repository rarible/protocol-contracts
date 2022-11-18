const Locking = artifacts.require("Locking");
const RariMineV3 = artifacts.require("RariMineV3");


const mainnet = {
	timelock: "0x7e9c956e3EFA81Ace71905Ff0dAEf1A71f42CBC5",
}
const goerli = {
	timelock: "0x1C795d4AEf47BBbf0698471A3b04D51b2BFac893",
}
const dev = {
	timelock: "0x0000000000000000000000000000000000000000",
}
const def = {
	timelock: "0x0000000000000000000000000000000000000000",
}

let settings = {
	"default": def,
	"mainnet": mainnet,
	"goerli": goerli,
	"dev": dev
};

function getSettings(network) {
	if (settings[network] !== undefined) {
		return settings[network];
	} else {
		return settings["default"];
	}
} 


module.exports = async function (deployer, network) {
  const { timelock } = getSettings(network);

  if (timelock === "0x0000000000000000000000000000000000000000") {
    console.log(`can't make zero address the owner. skipping 29th migration.`)
    return;
  }

  const locking = await Locking.deployed();
  await changeOwner(locking, timelock, "locking")

  const rariMineV3 = await RariMineV3.deployed();
  await changeOwner(rariMineV3, timelock, "rariMineV3")

};

async function changeOwner(contract, newOwner, contractName) {
  const oldOwner = await contract.owner();
  await contract.transferOwnership(newOwner)
  console.log(`for contract ${contractName} at ${contract.address} changed owner from ${oldOwner} to ${await contract.owner()}`)
}


