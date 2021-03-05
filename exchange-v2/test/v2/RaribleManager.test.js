const RaribleTransferManagerTest = artifacts.require("RaribleTransferManagerTest.sol");
const ERC721_V1 = artifacts.require("TestERC721WithRoyaltiesV1.sol");
const ERC721_V2 = artifacts.require("TestERC721WithRoyaltiesV2.sol");
const ERC721_NO = artifacts.require("TestERC721.sol");
const ERC721_V1_CRASH = artifacts.require("TestERC721WithRoyaltiesV1Crashed.sol");
const {enc, ETH, ERC20, ERC721, ERC1155} = require("../assets");
const { AssetType } = require("../order");

contract("RaribleTransferManager", accounts => {
    let lib;
    let erc721V1;
    let erc721V2;
    let erc721_no_interface;
    let erc721V1_crash;
    let erc721TokenId0 = 54;
    let erc721TokenId1 = 53;
    let i = 1;

    beforeEach(async () => {
        lib = await RaribleTransferManagerTest.new();
        /*NFT 721 RoyalitiesV1*/
        erc721V1 = await ERC721_V1.new("Rarible", "RARI", "https://ipfs.rarible.com");
        await erc721V1.initialize();
        await erc721V1.mint(accounts[0], erc721TokenId0, []);
        await erc721V1.mint(accounts[0], erc721TokenId1, [[accounts[2], 1000], [accounts[3], 500]]);
        /*NFT 721 RoyalitiesV2*/
        erc721V2 = await ERC721_V2.new("Rarible", "RARI", "https://ipfs.rarible.com");
        await erc721V2.initialize();
        await erc721V2.mint(accounts[0], erc721TokenId0, []);
        await erc721V2.mint(accounts[0], erc721TokenId1, [[accounts[2], 1300], [accounts[3], 2500]]);

        /*NFT 721 RoyalitiesV1 crash*/
        erc721V1_crash = await ERC721_V1_CRASH.new("Rarible", "RARI", "https://ipfs.rarible.com");
        await erc721V1_crash.initialize();
        await erc721V1_crash.mint(accounts[0], erc721TokenId0, []);
        await erc721V1_crash.mint(accounts[0], erc721TokenId1, [[accounts[2], 1300], [accounts[3], 2500]]);

        /*NFT 721 NO_INTERFACE*/
        erc721_no_interface = await ERC721_NO.new("Rarible", "RARI", "https://ipfs.rarible.com");
        await erc721_no_interface.mint(accounts[0], erc721TokenId0);
    });

    it("Test" + i + " erc721V1 ", async () => {
        assert.equal(await erc721V1.ownerOf(erc721TokenId0), accounts[0]);
        assert.equal(await erc721V1.ownerOf(erc721TokenId1), accounts[0]);
    });
    i++;

    it("Test" + i + " erc721V1  ", async () => {
        const fee = await lib.checkRoyaltyFee2(2000, erc721V1.address, erc721TokenId0, ERC721, 1000);
        console.log("NFT Royalities empty: " + JSON.stringify(fee));
        const fee1 = await lib.checkRoyaltyFee2(2000, erc721V1.address, erc721TokenId1, ERC721, 1000);
        console.log("NFT Royalities 10%, 5%: rest=1000 " + JSON.stringify(fee1));
        // assert.equal(fee, FEE_SIDE_TAKE);
    });
    i++;

    it("Test" + i + " erc721V2  ", async () => {
        const fee = await lib.checkRoyaltyFee2(2000, erc721V2.address, erc721TokenId0, ERC721, 1000);
        console.log("NFT Royalities empty: " + JSON.stringify(fee));
        const fee1 = await lib.checkRoyaltyFee2(2000, erc721V2.address, erc721TokenId1, ERC721, 1000);
        console.log("NFT Royalities 15%, 25%: rest=1000: " + JSON.stringify(fee1));
        const fee2 = await lib.checkRoyaltyFee2(2000, erc721V2.address, erc721TokenId1, ERC721, 400);
        console.log("NFT Royalities 15%, 25%: rest=400: " + JSON.stringify(fee2));
        // assert.equal(fee, FEE_SIDE_TAKE);
    });
    i++;

    it("Test" + i + "Value RariFee=5+5, Rest=950   ", async () => {
        const benFee = await lib.checkBeneficiaryFee(1000, 500, 500);
        // console.log("NFT Value RariFee=5, Rest=95: " + JSON.stringify(benFee));
        assert.equal(benFee[0], 950);
        assert.equal(benFee[1], 100);
    });
    i++;

    it("Test" + i + "Value RariFee=50+50, Rest=500   ", async () => {
        const benFee = await lib.checkBeneficiaryFee(1000, 5000, 5000);
        // console.log("NFT Value RariFee=5, Rest=95: " + JSON.stringify(benFee));
        assert.equal(benFee[0], 500);
        assert.equal(benFee[1], 1000);
    });
    i++;

    it("Test" + i + "Value RariFee=0, Rest=100   ", async () => {
        const fill = await lib.checkBeneficiaryFee(100, 0, 0);
        assert.equal(fill[0], 100);
        assert.equal(fill[1], 0);
    });

    /*function help to equal*/
    function assertFees(exp, actual) {
        assert.equal(JSON.stringify(exp), JSON.stringify(actual));
    }

    function Fee(receipient, value) {
        return [ receipient, value ];
    }

    it("Test7. checkGetRoyalties(), NFT721_V1, 2 royalties 10% and 5%   ", async () => {
        // AssetType(ERC721, enc(erc721V1.address, erc721TokenId0));
        const fees = await lib.checkGetRoyalties(AssetType(ERC721, enc(erc721V1.address, erc721TokenId1)));
        // console.log("NFT Royalities empty: " + JSON.stringify(fees));
        // console.log("NFT Royalities empty: " + JSON.stringify([Fee(accounts[2], "1000"), Fee(accounts[3], "500")]));
        // assert.equal(JSON.stringify([Fee(accounts[2], "1000"), Fee(accounts[3], "500")]), JSON.stringify(fees));
        assertFees([Fee(accounts[2], "1000"), Fee(accounts[3], "500")], fees);
    });

    it("Test8. checkGetRoyalties(), NFT721_V2, 2 royalties 13% and 25%   ", async () => {
        const fees = await lib.checkGetRoyalties(AssetType(ERC721, enc(erc721V2.address, erc721TokenId1)));
        assertFees([Fee(accounts[2], "1300"), Fee(accounts[3], "2500")], fees);
    });

    it("Test9. checkGetRoyalties(), NFT721_V2, EMPTY royalties    ", async () => {
        const fees = await lib.checkGetRoyalties(AssetType(ERC721, enc(erc721V2.address, erc721TokenId0)));
        assertFees([], fees);
    });

    it("Test10. checkGetRoyalties(), NFT721, no Interface   ", async () => {
        const fees = await lib.checkGetRoyalties(AssetType(ERC721, enc(erc721_no_interface.address, erc721TokenId0)));
        assertFees([], fees);
    });

    it("Test11. checkGetRoyalties(), NFT721V1, crashed   ", async () => {
        const fees = await lib.checkGetRoyalties(AssetType(ERC721, enc(erc721V1_crash.address, erc721TokenId0)));
        assertFees([], fees);
    });

    erc721V1_crash

});