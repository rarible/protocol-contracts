####TODO translate to Engl
#### Особенности

Контракт `ExchangeBulkV2` выполняет трансфер массива ордеров Rarible и OpenSea.
Контракт является оберткой верхнего уровня над контрактами `ExchangeV2` и `WyvernExchangeWithBulkCancellations`.

##### Алгоритм
Контракт работает с трансфером только за ETH.
Для запуска трансфера массива ордеров, нужно вызвать метод `bulkTransfer(TradeDetails[] memory tradeDetails)`.
Каждый Ордера должны быть упакован в структуру:   
`struct TradeDetails {
    bool marketWyvern;
    uint256 amount;
    bytes tradeData;
}`,
где:
- поле `marketWyvern` true - ордер OpenSea, else Rarible.
- поле `amount` стоимость.
- поле `tradeData` данные ордера для трансфера.

Для ордеров  `OpenSea` поле `tradeData` кодируется, как показано на примере метода `getDataWyvernAtomicMatch` [encode OpenSea](../test/contracts/v2/ExchangeBulkV2Test.sol).
Важно, что для ордеров  `OpenSea` необходимо сформировать ордер на продажу. Подписывать его не нужно.
Нужно в ордере на продажу установить `order.maker` ==  `ExchangeBulkV2.address`, в поле `calldataBuy` установить адрес покупателя.

Для ордеров `Rarible` поле `tradeData` кодируется, как показано на примере метода `getDataExchangeV2SellOrders` [encode OpenSea](../test/contracts/v2/ExchangeBulkV2Test.sol).
Важно, что для ордеров  `Rarible` сформировать ордер на продажу не нужно, он будет сформирован внутри метода `bulkTransfer`.

Допускается передавать в метод `bulkTransfer` mix Ордеров Rarible и OpenSea инкапсулированных в структуру `TradeDetails`, то есть вперемешку.

##### Тесты

Ссылка на тесты [Тесты](../test/v2/ExchangeBulkV2.rarible.test.js).

###### Ордер на покупку (Buyer side) должен быть заполенен:
Параметры поля addrs:
 - exchange, // address OpenSea contract
 - bulk, // address ExchangeBulkV2 contract
 - seller, // address seller
 - "0x0000000000000000000000000000000000000000", // feeRecipient buy
 - merkleValidatorAddr, // address MerkleValidator contract
 - "0x0000000000000000000000000000000000000000", // staticTarget buy
 - "0x0000000000000000000000000000000000000000", // paymentToken for (ETH)

Параметры поля uints:
 - 0, //makerRelayerFee buy (originFee)
 - 0, // takerRelayerFee buy
 - 0, // makerProtocolFee buy
 - 0, // takerProtocolFee buy
 - basePrice, // basePrice buy
 - 0, // extra buy
 - listingTime, // listingTime buy
 - expirationTime, // expirationTime buy
 - 0 // salt buy

Параметры поля feeMethodsSidesKindsHowToCalls:
 - 1, // FeeMethod{ ProtocolFee, SplitFee }) buy
 - 0, // SaleKindInterface.Side({ Buy, Sell }) buy
 - 0, // SaleKindInterface.SaleKind({ FixedPrice, DutchAuction }) buy
 - 1, // AuthenticatedProxy.HowToCall({ Call, DelegateCall } buycalldataBuy

Параметры полей calldataBuy, calldataSell:
Примеры генерации  этих полей представлены в методах `getDataERC1155UsingCriteria` (for 1155 token) and
`getDataERC721UsingCriteria` (for 721 token) и добавлением параметров merklePart, которые отличаются:
 - 721 merklePart: 
"0000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000c0
0000000000000000000000000000000000000000000000000000000000000000";

 - 1155 merklePart: 
"0000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000e0
0000000000000000000000000000000000000000000000000000000000000000";

Аналогично отличаются поля
replacementPatternBuy = "0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000...

replacementPatternSell = "0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff...

Первые 4Б + 32Б + 32Б for 1155 token и for 721 token аналогичны, но  каждая из масок для 1155 token длиннее на 32Б, заполнена нулями
 