export async function getNewOwner(hre:any) {
  const { deployer } = await hre.getNamedAccounts();
  return deployer;
}

export async function prepareTransferOwnershipCalldata(hre:any) {
  const transferOwnershipTo = await getNewOwner(hre)
  //address of this contract doesn't matter, using transferOwnershipTo instead
  const contract =  await hre.ethers.getContractAt('@openzeppelin/contracts-sol08/access/Ownable.sol:Ownable', transferOwnershipTo);
  const data = await contract.populateTransaction.transferOwnership(transferOwnershipTo);
  return data.data;
}