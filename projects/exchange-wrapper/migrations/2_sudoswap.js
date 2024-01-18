//SUDOSWAP
const LSSVMPairEnumerableERC20 = artifacts.require("LSSVMPairEnumerableERC20.sol");
const LSSVMPairEnumerableETH = artifacts.require("LSSVMPairEnumerableETH.sol");
const LSSVMPairMissingEnumerableERC20 = artifacts.require("LSSVMPairMissingEnumerableERC20.sol");
const LSSVMPairMissingEnumerableETH = artifacts.require("LSSVMPairMissingEnumerableETH.sol");
const LSSVMPairFactory = artifacts.require("LSSVMPairFactory.sol");
const LSSVMRouter = artifacts.require("LSSVMRouter.sol");
const LinearCurve = artifacts.require("LinearCurve.sol");
const ExponentialCurve = artifacts.require("ExponentialCurve.sol");

module.exports = async function (deployer, network, accounts) {
  const protocol = accounts[0];

  const _enumerableETHTemplate = (await deployContract(deployer, LSSVMPairEnumerableETH)).address;
  const _missingEnumerableETHTemplate = (await deployContract(deployer, LSSVMPairMissingEnumerableETH)).address;
  const _enumerableERC20Template = (await deployContract(deployer, LSSVMPairEnumerableERC20)).address
  const _missingEnumerableERC20Template = (await deployContract(deployer, LSSVMPairMissingEnumerableERC20)).address;

  const _protocolFeeMultiplier = "5000000000000000";

  //Deploy factory
  const factory = await deployContract(deployer, LSSVMPairFactory, [_enumerableETHTemplate, _missingEnumerableETHTemplate, _enumerableERC20Template, _missingEnumerableERC20Template, protocol, _protocolFeeMultiplier])

  //Deploy router
  const router = await deployContract(deployer, LSSVMRouter, [factory.address])

  //Whitelist router in factory
  await factory.setRouterAllowed(router.address, true)

  //Deploy bonding curves
  const exp = await deployContract(deployer, ExponentialCurve)
  const lin = await deployContract(deployer, LinearCurve)

  // Whitelist bonding curves in factory
  await factory.setBondingCurveAllowed(exp.address, true)
  await factory.setBondingCurveAllowed(lin.address, true)

  console.log(`deployed sudoswap factory = ${factory.address} and router = ${router.address}`)
  console.log(`ExponentialCurve = ${exp.address}, LinearCurve = ${lin.address}`)

};

async function deployContract(deployer, contract, args = []) {
  if (args.length > 0) {
    await deployer.deploy(contract, ...args)
  } else {
    await deployer.deploy(contract)
  }
  return contract.deployed();
}
