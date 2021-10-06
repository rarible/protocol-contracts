## Auction House
This contract implements English auction with fixed step

### Features

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
    