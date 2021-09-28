#### Features
1. `RoyaltiesProviderArtBlocks` allows to retrive royalties of artBlocks collections`.

1. ## artblocks address
    - owner of the contract recieves artblocks part of the royalty
    - owner can be changed using `transferOwnership`(address newOwner) method
    - event `OwnershipTransferred`(address indexed previousOwner, address indexed newOwner) is emitted when owner changed

2. ## uint96 artblocksPercentage = 250;
    - The amount of artBlocks' royalties is set to `250` or `2%` at contract inicialization
    - value can be changed by owner using `setArtblocksPercentage`(uint96 _artblocksPercentage) method
    - event `ArtblocksPercentageChanged`(address _who, uint96 _old, uint96 _new) is emitted when the value is changed

3. `getRoyalties`(address token, uint tokenId)
    - method calculates all roaylties in contract `token` for id=`tokenId`, and returns them in `LibPart.Part` array
    - first element or royalties is formed from `owner` and `artblocksPercentage` variables; 
    - data about royalties is requested from `token` contract, we get:
        - address `artistAddress` - artist address for royalties
        - address `additionalPayee` - additional payee address for toyalties
        - uint256 `additionalPayeePercentage` - `percentage` of `royaltyFeeByID` that goes to additional payee(e.g. `royaltyFeeByID` = 10%, `additionalPayeePercentage` = 40%, then `additionalPayee` gets 0,1 * 0,4 = 0,04 = 4% of total amount)
        - uint256 `royaltyFeeByID` - total percentage of royalties for artist and additionalPayee
    - second element is calcualted using `artistAddress`, `royaltyFeeByID` and `additionalPayeePercentage`
    - then, if `additionalPayeePercentage` is > 0, the third elemnt is calculated using `additionalPayee` and `additionalPayeePercentage`



Migration is in [5_royalties_provider_art_blocks](../../migrations/5_royalties_provider_art_blocks.js)