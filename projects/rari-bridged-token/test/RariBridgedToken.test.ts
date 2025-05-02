import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { should } from "chai";
import { ethers } from "hardhat";
import { RariBridgedToken } from "../typechain-types";
import { TestERC20 } from "../typechain-types/test";

should();

describe("RariBridgedToken", () => {

    let token: RariBridgedToken
    let owner: SignerWithAddress
    let admin: SignerWithAddress
    let minter: SignerWithAddress
    let minter2: SignerWithAddress
    let someone: SignerWithAddress
    let others: SignerWithAddress[]

    let testERC20: TestERC20

    beforeEach(async () => {
        [owner, admin, minter, minter2, someone, ...others] = await ethers.getSigners()

        const erc20Factory = await ethers.getContractFactory("TestERC20")
        testERC20 = await erc20Factory.deploy()

        const factory = await ethers.getContractFactory("RariBridgedToken", owner)
        token = await factory.deploy()
        await token.__RariBridgedToken_init(testERC20.address, admin.address, minter.address, others[0].address, others[1].address, others[2].address)
    })

    it("customGateway should have correct addresses", async () => {
        await token.previous().should.eventually.eq(testERC20.address, "previous address is incorrect")
        await token.l1Address().should.eventually.eq(others[0].address, "l1 address is incorrect")
        await token.customGateway().should.eventually.eq(others[1].address, "custom gateway address is incorrect")
        await token.router().should.eventually.eq(others[2].address, "router address is incorrect")
    })

    it("minter should be able to mint and nobody else", async () => {
        await token.bridgeMint(owner.address, 10, { from: owner.address }).should.be.rejectedWith("AccessControlUnauthorizedAccount")
        await token.connect(minter).bridgeMint(owner.address, 10)
        await token.totalSupply().should.eventually.eq(10)
    })

    it("admin should be able to give minter role to another account", async () => {
        const role = await token.MINTER_ROLE()
        await token.grantRole(role, minter2.address).should.be.rejectedWith("AccessControlUnauthorizedAccount")
        await token.connect(minter2).bridgeMint(owner.address, 10).should.be.rejectedWith("AccessControlUnauthorizedAccount")
        await token.connect(admin).grantRole(role, minter2.address)
        await token.connect(minter2).bridgeMint(owner.address, 100)
        await token.totalSupply().should.eventually.eq(100)
    })

    it("should wrap previous token", async () => {
        await testERC20.mint(someone.address, 100)
        await testERC20.connect(someone).approve(token.address, 100)
        await token.connect(someone).wrap(someone.address, 100)

        await token.balanceOf(someone.address).should.eventually.eq(100)
        await testERC20.balanceOf(token.address).should.eventually.eq(100)
    })
})