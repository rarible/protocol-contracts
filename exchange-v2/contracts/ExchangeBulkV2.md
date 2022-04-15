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