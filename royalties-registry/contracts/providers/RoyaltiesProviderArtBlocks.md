#### Features
1. `RoyaltiesProviderArtBlocks` allows to retrive royalties of artBlocks collections`.

1. ## address payable `artblocksAddress`;

    -   Required to be set in constructor, it's the address that Art Blocks are getting their part of royalties on. Can't be zero
    -   `setArtblocksAddress`(address payable _artblocksAddress)
        - method to change `setArtblocksAddress` variable
        - can be only called from address already set in artblocksAddress
        - new address can't be zero
        - emits event ArtblocksAddressChanged
    -   event `ArtblocksAddressChanged`(address `_from`, address `_to`)
        - emits when `artblocksAddress` changed from address `_from` to address `_to`

2. ## uint96 artblocksPercentage = 250;
    - The amount of artBlocks' royalties is constant and set in variable `artblocksPercentage` as `250` or `2.5%`;

3. `getRoyalties`(address token, uint tokenId)
    - method calculates all roaylties in contract `token` for id=`tokenId`, and returns them in `LibPart.Part` array
    - first element or royalties is formed from `artblocksAddress` and `artblocksPercentage` variables; 
    - data about royalties is requested from `token` contract, we get:
        - address `artistAddress` - artist address for royalties
        - address `additionalPayee` - additional payee address for toyalties
        - uint256 `additionalPayeePercentage` - `percentage` of `royaltyFeeByID` that goes to additional payee(e.g. `royaltyFeeByID` = 10%, `additionalPayeePercentage` = 40%, then `additionalPayee` gets 0,1 * 0,4 = 0,04 = 4% of total amount)
        - uint256 `royaltyFeeByID` - total percentage of royalties for artist and additionalPayee
    - second element is calcualted using `artistAddress`, `royaltyFeeByID` and `additionalPayeePercentage`
    - then, if `additionalPayeePercentage` is > 0, the third elemnt is calculated using `additionalPayee` and `additionalPayeePercentage`



Migration is in [5_royalties_provider_art_blocks](../../migrations/5_royalties_provider_art_blocks.js)