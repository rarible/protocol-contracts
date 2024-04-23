import { expect } from "chai";
import { assert, deployments, ethers } from "hardhat";
import "@nomicfoundation/hardhat-toolbox";
import { network } from "hardhat"
import hre from "hardhat";

import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import { TransferProxy } from "../../typechain-types";
import { Ownable } from "../../typechain-types";

async function getContract<ContractType>(contractName: string) {
    const address = (await hre.deployments.get(contractName)).address;
    return await hre.ethers.getContractAt(contractName, address) as ContractType
}

describe("Test Owner Check", function () {

  let owner: SignerWithAddress;
  let targetOwner = "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4"

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
  });

  describe("owners should match target", function () {
    it("check owner", async function () {
        let transferProxy = await getContract<TransferProxy>("TransferProxy");
        assert.equal(await transferProxy.owner(), targetOwner);

        const allDeployments = await hre.deployments.all()
        for (const [contractName, deployment] of Object.entries(allDeployments)) {
            console.log(contractName, deployment.address)
            if(!contractName.includes("_") && contractName != "DefaultProxyAdmin" && contractName != "AssetMatcherCollection") {
                let contract = await getContract<Ownable>(contractName)
                console.log("check ownership")
                let owner = ""
                try{
                    owner = await contract.owner()
                    console.log(owner)
                    
                }
                catch(e){
                    console.log(e)
                }
                if(owner.length > 0) {
                    assert.equal(owner, targetOwner);
                }
            }
        }
    });
    
  })

});


