  # Features

 `RoyaltiesRegistry` contract allows to processing different types of royalties:

* `royaltiesByToken`
* v2
* v1
* external provider
* EIP-2981

## Methods

* Sets royalties for the entire collection (`royaltiesByToken`)

    ```javascript
    function setRoyaltiesByToken(address token, LibPart.Part[] memory royalties) external
    ```

* Sets the provider's royalties — a separate contract that will return the royalties

    ```javascript
    function setProviderByToken(address token, address provider) external
    ```

* The implementation of Royalties v2, v1 and EIP-2981 is located inside the token and processed in this method

    ```javascript
    function getRoyalties(address token, uint tokenId)
    ```
