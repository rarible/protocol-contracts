const Migrations = artifacts.require("Migrations");

module.exports = async function (deployer) {
	try {
		const deployed = await Migrations.deployed();
		if (deployed == null) {
			await deployer.deploy(Migrations, { gas: 200000 });
		}
	} catch(e) {
		await deployer.deploy(Migrations, { gas: 200000 });
	}
};
