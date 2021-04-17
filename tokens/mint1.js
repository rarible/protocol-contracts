const erc721 = await ERC721Rarible.deployed();
const uri = "/ipfs/QmWLsBu6nS4ovaHbGAXprD1qEssJu4r5taQfB74sCG51tp";
const tokenId = "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4000000000000000000000001";
const message = [tokenId, uri, [["0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4", 10000]], [], ["0x"]];
await erc721.mintAndTransfer(message, "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4", {gas: "500000"});

const erc1155 = await ERC1155Rarible.deployed();
const uri = "/ipfs/QmWLsBu6nS4ovaHbGAXprD1qEssJu4r5taQfB74sCG51tp";
const tokenId = "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4000000000000000000000001";
const message1 = [tokenId, uri, 10, [["0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4", 10000]], [], ["0x"]];
await erc1155.mintAndTransfer(message1, "0xfb571F9da71D1aC33E069571bf5c67faDCFf18e4", 10, {gas: "500000"});