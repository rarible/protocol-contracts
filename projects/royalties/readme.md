### Interfaces for NFT smart contracts to specify royalties.

#### There are two versions:
- v1: old version, doesn't require abi decoder v2
- v2: newest version, requires abi decoder v2, uses less gas in reference implementation contracts (about 5000)

Also, these contracts should be ERC-165 compliant.

We do not use other libraries here to support ERC-165 because different projects can use different libraries (for example, @openzeppelin/contracts or @openzeppelin/contracts-upgradeable)

You can check reference implementations for these interfaces in impl folder