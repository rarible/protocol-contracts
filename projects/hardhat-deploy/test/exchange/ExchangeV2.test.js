const truffleAssert = require('truffle-assertions');
const { deployments } = require('hardhat');

const MDNT = artifacts.require("MDNT.sol");

contract("ExchangeV2, sellerFee + buyerFee =  6%,", accounts => {
  let mdnt;

  before(async () => {
    //const deployed = await deployments.fixture(['all'])
    mdnt = await MDNT.new();

    await mdnt.initialize(
      accounts[0],
      "Midnight in Tokyo",
      "MDNT",
      "ipfs://QmcFvCsrbhgHHeux9SeQWFdCMU1CF4Xhq9HKYF9VmtY5ie/0",
      [],
      "0x0f22f838AAcA272AFb0F268e4f4E655fAc3a35ec",
      "0x0f22f838AAcA272AFb0F268e4f4E655fAc3a35ec",
      1000,
      0,
      "0x0f22f838AAcA272AFb0F268e4f4E655fAc3a35ec"
    )

    console.log(await mdnt.name())
    console.log(accounts[0])
    
  });

  describe("test", () => {
    it("test", async () => {
      await mdnt.multicall(["0x74bc7db700000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000065e8a661ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005af3107a4000000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000037697066733a2f2f516d5675393865637a5a52705359634633554b5952446b48734d32524d515236324b55596d6b32395544625754502f30000000000000000000"])
      //console.log(await mdnt.getActiveClaimConditionId())
      //console.log(await mdnt.getClaimConditionById(0))

      await mdnt.lazyMint(1, "ipfs://QmagPm7WQyr1VStPu4QcNQMLspagsVGBW8gawVBBP7Sy7f/", "0x")
      await mdnt.lazyMint(1, "ipfs://QmdCrybyjGAvJvMAq1KSyequ4gVmJr51t8HtWwiqPMv794/", "0x")

      const txClaim = await mdnt.claim(
        accounts[0], 
        1, 
        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", 
        100000000000000, 
        [["0x0000000000000000000000000000000000000000000000000000000000000000"],"115792089237316195423570985008687907853269984665640564039457584007913129639935","100000000000000","0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"],
        "0x",
        {value: 100000000000000}
      )
      console.log(txClaim.receipt.gasUsed)
      console.log(await mdnt.ownerOf(0))

      const txMint = await mdnt.mint(accounts[0], 1, {value: 100000000000000})
      console.log(txMint.receipt.gasUsed)

      await mdnt.lazyMint(100, "ipfs://QmdCrybyjGAvJvMAq1KSyequ4gVmJr51t8HtWwiqPMv794/", "0x")

      await mdnt.mint(accounts[0], 50, {value: 5000000000000000})

      console.log(await mdnt.ownerOf(1))
    })

  });


});
