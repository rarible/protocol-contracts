const LibFeeSideTest = artifacts.require("LibFeeSideTest.sol");
const {enc, ETH, ERC20, ERC721, ERC1155} = require("../assets");
const FEE_SIDE_NONE = 0;
const FEE_SIDE_MAKE = 1;
const FEE_SIDE_TAKE = 2;

contract("LibFeeSide", accounts => {
    let lib;
    let i=1;
    beforeEach(async () => {
        lib = await LibFeeSideTest.new();
    });

    it("Test : ETH, ERC20; MAKE wins ", async () => {
        const fee = await lib.getFeeSideTest(ETH, ERC20);
        assert.equal(fee, FEE_SIDE_MAKE);
    });

    it("Test : ERC20, ETH; TAKE wins ", async () => {
        const fee = await lib.getFeeSideTest(ERC20, ETH);
        assert.equal(fee, FEE_SIDE_TAKE);
    });

    it("Test : ERC20, ERC1155; MAKE wins ", async () => {
        const fee = await lib.getFeeSideTest(ERC20, ERC1155);
        assert.equal(fee, FEE_SIDE_MAKE);
    });

    it("Test : ERC1155, ERC20; TAKE wins ", async () => {
        const fee = await lib.getFeeSideTest(ERC1155, ERC20);
        assert.equal(fee, FEE_SIDE_TAKE);
    });

    it("Test : ERC1155, ETH; TAKE wins ", async () => {
        const fee = await lib.getFeeSideTest(ERC1155, ETH);
        assert.equal(fee, FEE_SIDE_TAKE);
    });

    it("Test : ETH, ERC1155; MAKE wins ", async () => {
        const fee = await lib.getFeeSideTest(ETH, ERC1155);
        assert.equal(fee, FEE_SIDE_MAKE);
    });

    it("Test : ERC721, ETH; TAKE wins ", async () => {
        const fee = await lib.getFeeSideTest(ERC721, ETH);
        assert.equal(fee, FEE_SIDE_TAKE);
    });

    it("Test : ERC20, ERC721; MAKE wins ", async () => {
        const fee = await lib.getFeeSideTest(ERC20, ERC721);
        assert.equal(fee, FEE_SIDE_MAKE);
    });

    it("Test : ERC1155, ERC721; MAKE wins ", async () => {
        const fee = await lib.getFeeSideTest(ERC1155, ERC721);
        assert.equal(fee, FEE_SIDE_MAKE);
    });

    it("Test : ERC721, ERC721; NONE wins ", async () => {
        const fee = await lib.getFeeSideTest(ERC721, ERC721);
        assert.equal(fee, FEE_SIDE_NONE);
    });

    it("Test : ETH, not Asset; MAKE wins ", async () => {
        const fee = await lib.getFeeSideTest(ETH, '0x12345678');
        assert.equal(fee, FEE_SIDE_MAKE);
    });

    it("Test : not Asset, ERC1155; TAKE wins ", async () => {
        const fee = await lib.getFeeSideTest('0x12345678', ERC1155);
        assert.equal(fee, FEE_SIDE_TAKE);
    });

    it("Test : not Asset, not Asset; NONE wins ", async () => {
        const fee = await lib.getFeeSideTest('0x12345678', '0x87654321');
        assert.equal(fee, FEE_SIDE_NONE);
    });

    it("Test : MAKE == TAKE; MAKE wins ", async () => {
        const fee = await lib.getFeeSideTest(ETH, ETH);
        assert.equal(fee, FEE_SIDE_MAKE);
    });
});