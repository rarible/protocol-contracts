const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const ExchangeV2 = artifacts.require("ExchangeV2.sol");
const TestERC20 = artifacts.require("TestERC20.sol");
const TestERC721 = artifacts.require("TestERC721.sol");
const TestERC1155 = artifacts.require("TestERC1155.sol");
const ERC1155_V2 = artifacts.require("TestERC1155WithRoyaltiesV2.sol");
const ERC721_V1 = artifacts.require("TestERC721WithRoyaltiesV1.sol");
const TransferProxyTest = artifacts.require("TransferProxyTest.sol");
const ERC20TransferProxyTest = artifacts.require("ERC20TransferProxyTest.sol");
const LibOrderTest = artifacts.require("LibOrderTest.sol");
const RaribleTransferManagerTest = artifacts.require("RaribleTransferManagerTest.sol");
const truffleAssert = require('truffle-assertions');
const TestRoyaltiesRegistry = artifacts.require("TestRoyaltiesRegistry.sol");
const AuctionHouse = artifacts.require("AuctionHouse");

const { Order, Asset, sign } = require("../order");
const EIP712 = require("../EIP712");
const ZERO = "0x0000000000000000000000000000000000000000";
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, enc, id } = require("../assets");

contract("ExchangeV2, sellerFee + buyerFee =  6%,", accounts => {
    let exchangeV2;
    let transferProxy;
    let erc20TransferProxy;
    let transferManagerTest;
    let t1;
    let t2;
    let libOrder;
    let protocol = accounts[9];
    let community = accounts[8];
    const eth = "0x0000000000000000000000000000000000000000";
    let erc721TokenId0 = 52;
    let erc721TokenId1 = 53;
    let erc1155TokenId1 = 54;
    let erc1155TokenId2 = 55;
    let royaltiesRegistry;
    let auctionHouse;

    beforeEach(async () => {
        transferProxy = await TransferProxyTest.new();
        erc20TransferProxy = await ERC20TransferProxyTest.new();
        royaltiesRegistry = await TestRoyaltiesRegistry.new();
        exchangeV2 = await deployProxy(ExchangeV2, [transferProxy.address, erc20TransferProxy.address, 300, community, royaltiesRegistry.address], { initializer: "__ExchangeV2_init" });
        transferManagerTest = await RaribleTransferManagerTest.new();
        t1 = await TestERC20.new();
        t2 = await TestERC20.new();
        /*ETH*/
        await exchangeV2.setFeeReceiver(eth, protocol);
        await exchangeV2.setFeeReceiver(t1.address, protocol);
        /*ERC721 */
        erc721 = await TestERC721.new("Rarible", "RARI", "https://ipfs.rarible.com");
        /*ERC1155V2*/
        erc1155_v2 = await ERC1155_V2.new("https://ipfs.rarible.com");
        erc1155_v2.initialize();
        /*ERC721_V1 */
        erc721V1 = await ERC721_V1.new("Rarible", "RARI", "https://ipfs.rarible.com");
        await erc721V1.initialize();

        auctionHouse = await deployProxy(AuctionHouse, [transferProxy.address, erc20TransferProxy.address, exchangeV2.address], { initializer: "__AuctionHouse_init" });

    });
    describe("simple auction", () => {
        it("create auction ", async () => {
            console.log(await auctionHouse.auctions(0))
        })

    });


    function encDataV1(tuple) {
        return transferManagerTest.encode(tuple);
    }

    async function getSignature(order, signer) {
        return sign(order, signer, exchangeV2.address);
    }

});
