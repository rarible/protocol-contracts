export async function getNewOwner(hre:any) {
  const { deployer } = await hre.getNamedAccounts();
  return "0x256eFfCeA2ab308D31e318728D2615545171d85B";
}

export async function prepareTransferOwnershipCalldata(hre:any) {
  const transferOwnershipTo = await getNewOwner(hre)
  //address of this contract doesn't matter, using transferOwnershipTo instead
  const contract =  await hre.ethers.getContractAt('@openzeppelin/contracts-sol08/access/Ownable.sol:Ownable', transferOwnershipTo);
  const data = await contract.populateTransaction.transferOwnership(transferOwnershipTo);
  return data.data;
}

export function getSalt() {
  return "0x0000000000000000000000000000000000000000000000000000000000000000";
}
