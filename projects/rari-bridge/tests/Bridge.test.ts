import { expect } from "chai";
import { deployments, ethers } from "hardhat";

describe("RariBridge", function () {
  it("Deploys RariOFT on base-sepolia (mock)", async () => {
    await deployments.fixture(["RariOFT"]);
    const RariOFT = await ethers.getContract("RariOFT");
    expect(await RariOFT.name()).to.equal("Rarible Token");
    expect(await RariOFT.symbol()).to.equal("RARI");
  });

  it("Deploys RariOFTAdapter on sepolia (mock)", async () => {
    await deployments.fixture(["RariOFTAdapter"]);
    const RariOFTAdapter = await ethers.getContract("RariOFTAdapter");
    expect(await RariOFTAdapter.token()).to.equal("0xDe438f962c321680538A95826B14D41B8334AE43");
  });

  // Cross-chain tests manual
});