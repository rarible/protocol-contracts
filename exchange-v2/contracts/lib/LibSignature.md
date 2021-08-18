#### Features

The library recovers address of the signer from a signature.
## recover(bytes32 hash, bytes memory signature)
- recovers r,s,v values from signature
- calls recover(bytes32 hash, uint8 v, bytes32 r, bytes32 s)
## recover(bytes32 hash, uint8 v, bytes32 r, bytes32 s)
- checks values of s and v for correctness
- checks for v > 30 case
    - if v > 30, then the signature came from a wallet that doesn't support EIP-712 type of signatures
    - in that case, we need to adjust hash of the message with "\x19Ethereum Signed Message:\n32"
    - and set v = v - 4
- then the address of the signer is recovered

tests are in [LibSignature.test.js](../../test/v2/LibSignature.test.js)