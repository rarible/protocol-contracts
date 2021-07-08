## Rarible protocol smart contracts for NFT

### Architecture

These contracts are built using openzeppelin's upgradeable smart contracts. There are 2 versions of tokens:

- Rarible common contracts (ERC-721 and ERC-1155)
- Rarible user-owned contracts (ERC-721 and ERC-1155) - users deploy these contracts, only owners can mint in these

All these contracts support these features:

- lazy mint: there is mintAndTransfer function, it mints and transfers NFT to the new owner
- Rarible on-chain royalties
- multiple creators
- supports operators (who can transfer tokens on behalf of users) for the whole smart contract
- upgradeable 

User-owned contracts use beacon proxies and these contracts can be updated by rarible DAO.
Rarible common contracts can be upgraded too.

### Minting

Minting is done using mintAndTransfer function in both (ERC-721 and ERC-1155) contracts.
For ERC-721 function has following signature: `mintAndTransfer(LibERC721LazyMint.Mint721Data memory data, address to)`

```
    struct Mint721Data {
        uint tokenId;
        string uri;
        address[] creators;
        LibPart.Part[] royalties;
        bytes[] signatures;
    }
```  

- **tokenId** - regular ERC-721 tokenId
- **uri** - suffix for the token uri. prefix is usually "ipfs:/"
- **creators** - array of addresses who considered authors of the work. Will be saved, anyone can query this info.
- **fees** - array of royalties, will be saved. . Will be saved, anyone can query this info.
- **signatures** - array of signatures of this information. Signature should be present for every creator (only exception is when creator sends mint transaction)

For ERC-1155 function has some more arguments: `mintAndTransfer(LibERC1155LazyMint.Mint1155Data memory data, address to, uint256 _amount)`

```
    struct Mint1155Data {
        uint tokenId;
        string uri;
        uint supply;
        address[] creators;
        LibPart.Part[] royalties;
        bytes[] signatures;
    }
```

- **tokenId** - ERC-1155 tokenId
- **uri** - suffix for the token uri. prefix is usually "ipfs:/"
- **supply** - total supply for tokenId. can not be changed after initial mint.
- **creators** - array of addresses who considered authors of the work. Will be saved, anyone can query this info.
- **fees** - array of royalties, will be saved. . Will be saved, anyone can query this info.
- **signatures** - array of signatures of this information. Signature should be present for every creator (only exception is when creator sends mint transaction)

mintAndTransfer for ERC-1155 can be called multiple times until total minted amount is not equal to supply.

### Lazy minting

Function mintAndTransfer can be used for regular mint (when creator mints NFT). Or it can be used for lazy mint: when creator signs mint request data and then anyone can mint NFT.

transferFromOrMint first transfers tokens already minted, then it mints token if necessary 

### Smart-contract wide operator

Our smart contracts have one smart-contract wide operator (Rarible protocol Exchange contracts). This prevents users from approving transfers to our Exchange contracts. This way users save gas fees.