const TransferProxy = artifacts.require('TransferProxy');


module.exports = async function (deployer) {
	await deployer.deploy(TransferProxy, { gas: 1500000 });
	const transferProxy = await TransferProxy.deployed();
	await transferProxy.__OperatorRole_init({ gas: 200000 });
    console.log("ERC721 ERC1155 deployed at", transferProxy.address)
};