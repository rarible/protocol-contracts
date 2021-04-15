## Royalties Provider (contract RoyaltiesRegistry)
#### Need to know before:
- struct Part[]  {address account; uint value} - simple one-level structure to save address author and their part.
### Methods
RoyaltiesRegistry is a separate contract, which provides interface: **getRoyalties**() 
and methods: **setProviderByToken**(), **setRoyaltiesByToken**(), **setRoyaltiesByTokenAndTokenId**(). Methods can be called by Owner contract RoyaltiesRegistry or by Owner contract (token), which address set as input 
parameter *token*.

Royalties Provider - any contract, which supports IRoyaltiesProvider interface. In this way any contract can inherit IRoyaltiesProvider interface and realize own method **getRoyalties**(). Address Royalties Provider contract will appear in ProviderRoyalties hash storage(use further PHS) after calling method **setProviderByToken**().

**getRoyalties**(address token, uint tokenId) returns(Part[] memory royalties);
- Input parameter: *token* - address token;
- Input parameter: *tokenId* - token Id;
- Returns: royalties - Part[] array *royalties.*

Algorithm **getRoyalties()** consists of three parts:
1. Check RoyaltiesRegistry hash storage(use further RHS), if find royalties by token or tokenId, return royalties.
2. Check PHS by input *token*. If find a contract address in PHS, check contract supports IRoyaltiesProvider interface, get royalties by IRoyaltiesProvider interface,  save royalties in RHS, return royalties.
3. Check contract royalties by *token* and *tokenId.* If contract supports RoyaltiesV1 or RoyaltiesV2 interface, get royalties by one of supported interfaces (RoyaltiesV1 or RoyaltiesV2), save royalties in RHS, return royalties.

**setProviderByToken**(address token, address provider); Save address provider in PHS. This method don`t update RHS. If it necessary to save royalties in RHS, user need to call method **setRoyaltiesByTokenAndTokenId**()**.**
- Input parameter: *token* - address token;
- Input parameter: *tokenId* - token Id.

**setRoyaltiesByTokenAndTokenId**(address token, uint tokenId, Part[] memory royalties); Save royalties in RHS.
- Input parameter: *token* - address token;
- Input parameter: *tokenId* - token Id;
- Input parameter: royalties - array royalties, each item content author address and author part.

**setRoyaltiesByToken**(address token, Part[] memory royalties); Save royalties in RHS.
- Input parameter: *token* - address token;
- Input parameter: *royalties* - array royalties, each item content author address and author part.