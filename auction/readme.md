# Auction House
This contract implements English auction with fixed step

## Features
### Time frame

Auction time frame is decided by 2 parameters
  - `duration`
    - mandatory parameter, that defines the duration of auction in seconds
    - it must be between `15 minutes` and `1000 days` (these values are constant)
  - `startTime`
    - optional parameter that defines the start time an auction
    - unix timestamp, can't be less than the time of creation of the auction

So there are two cases of how the auction time fate can work:
  - if `startTime` is 0, then then the auction starts at the first bid that satisfies `minimalPrice`. Then the `endTime` is calculated at the moment of the first bid as well (`now` + `duration`)
  - if `startTime` is set, then the `endTime` is calculated at the creation of an auction (`startTime` + `duration`)

If a new bid is put when auction has less than `15 minutes` left till `endTime`, then `endTime` = `now` + `15 minutes`

#### Data model
Data model consists of two structures
##### Auction:
 - **sellAsset** - seller Asset
 - **buyAsset** - buyer AssetType 
 - **lastBid** -  successfully `Bid` fixed run method `putBid`
 - **seller** - seller address
 - **buyer** - buyer address
 - **endTime** - finish time (in timestamps)
 - **minimalStep** - min step, next `bid` 
 - **minimalPrice** - minimal price
 - **protocolFee** - protocol fee
 - **dataType** - data type
 - **data** - encoded data: duration, buyOutPrice, origin, payouts\
 - `Data` with type `dataV1`:\
        *originFees* - array fees\
        *duration*  - duration in seconds\
        *startTime* - start time in timestamp\
        *buyOutPrice* - `Bid` price finish auction
##### Bid:
 - **amount** - `bid` amount
 - **dataType** - data type
 - **data** - encoded data: origin, payouts
- `Data` with type `dataV1`:\
        *originFees* - array fees
#### Function, supported for every user
  ***startAuction*** - start new auction, emit event `AuctionCreated(uint idAuction, Auction auction)`:\
        - *_sellAsset* - seller Asset\
        - *_buyAsset* - buyer AssetType\
        - *endTime* - finish time (in timestamps)\
        - *minimalStep* - min step\
        - *minimalPrice* - min price\
        - *dataType* - data type\
        - *data* -data
  
  ***putBid*** - put bid, emit event `BidPlaced(uint idAuction)` as result of successfully placed bid:\
        - *_auctionId* - auction id\
        - *bid* - `Bid`
  
  ***finishAuction*** - finish auction, available only for contract owner, emit event `AuctionFinished( _auctionId)`: \
        - *_auctionId* auction id
  
  ***buyOut*** - finish auction with buyOut price `Bid`:\
        - *_auctionId* - auction id\
        - *bid* - `Bid`
    