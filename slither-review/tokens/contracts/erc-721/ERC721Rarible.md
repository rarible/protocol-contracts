**THIS CHECKLIST IS NOT COMPLETE**. Use `--show-ignored-findings` to show all the results.
Summary
 - [shadowing-state](#shadowing-state) (4 results) (High)
 - [uninitialized-local](#uninitialized-local) (2 results) (Medium)
 - [unused-return](#unused-return) (9 results) (Medium)
 - [shadowing-local](#shadowing-local) (9 results) (Low)
 - [calls-loop](#calls-loop) (1 results) (Low)
 - [reentrancy-benign](#reentrancy-benign) (2 results) (Low)
 - [reentrancy-events](#reentrancy-events) (3 results) (Low)
 - [assembly](#assembly) (4 results) (Informational)
 - [pragma](#pragma) (1 results) (Informational)
 - [dead-code](#dead-code) (43 results) (Informational)
 - [solc-version](#solc-version) (40 results) (Informational)
 - [low-level-calls](#low-level-calls) (3 results) (Informational)
 - [naming-convention](#naming-convention) (51 results) (Informational)
 - [redundant-statements](#redundant-statements) (2 results) (Informational)
 - [too-many-digits](#too-many-digits) (2 results) (Informational)
 - [unimplemented-functions](#unimplemented-functions) (1 results) (Informational)
 - [unused-state](#unused-state) (3 results) (Informational)
## shadowing-state
Impact: High
Confidence: High
 - [ ] ID-0
[ERC721Lazy._INTERFACE_ID_ERC721_ENUMERABLE](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L20) shadows:
	- [ERC721Upgradeable._INTERFACE_ID_ERC721_ENUMERABLE](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L90)

../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L20


 - [ ] ID-1
[ERC721Lazy._INTERFACE_ID_ERC721_METADATA](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L19) shadows:
	- [ERC721Upgradeable._INTERFACE_ID_ERC721_METADATA](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L81)

../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L19


 - [ ] ID-2
[ERC721Lazy._INTERFACE_ID_ERC165](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L17) shadows:
	- [ERC165Upgradeable._INTERFACE_ID_ERC165](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L18)

../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L17


 - [ ] ID-3
[ERC721Lazy._INTERFACE_ID_ERC721](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L18) shadows:
	- [ERC721Upgradeable._INTERFACE_ID_ERC721](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L72)

../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L18


## uninitialized-local
Impact: Medium
Confidence: Medium
 - [ ] ID-4
[LibRoyalties2981.calculateRoyalties(address,uint256).result](../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L16) is a local variable never initialized

../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L16


 - [ ] ID-5
[ERC1271Validator.validate1271(address,bytes32,bytes).signerFromSig](../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L19) is a local variable never initialized

../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L19


## unused-return
Impact: Medium
Confidence: Medium
 - [ ] ID-6
[ERC721Upgradeable._mint(address,uint256)](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L344-L356) ignores return value by [_tokenOwners.set(tokenId,to)](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L353)

../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L344-L356


 - [ ] ID-7
[ERC721Upgradeable._burn(uint256)](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L368-L386) ignores return value by [_tokenOwners.remove(tokenId)](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L383)

../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L368-L386


 - [ ] ID-8
[ERC721Upgradeable._transfer(address,address,uint256)](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L409-L424) ignores return value by [_holderTokens[from].remove(tokenId)](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L418)

../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L409-L424


 - [ ] ID-9
[ERC721Upgradeable._mint(address,uint256)](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L344-L356) ignores return value by [_holderTokens[to].add(tokenId)](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L351)

../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L344-L356


 - [ ] ID-10
[ERC721Upgradeable._transfer(address,address,uint256)](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L409-L424) ignores return value by [_tokenOwners.set(tokenId,to)](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L421)

../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L409-L424


 - [ ] ID-11
[ERC721Upgradeable._burn(uint256)](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L368-L386) ignores return value by [_holderTokens[owner].remove(tokenId)](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L381)

../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L368-L386


 - [ ] ID-12
[ERC721Lazy._mint(address,uint256)](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L74-L92) ignores return value by [_tokenOwners.set(tokenId,to)](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L83)

../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L74-L92


 - [ ] ID-13
[ERC721Upgradeable._transfer(address,address,uint256)](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L409-L424) ignores return value by [_holderTokens[to].add(tokenId)](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L419)

../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L409-L424


 - [ ] ID-14
[ERC721Lazy._mint(address,uint256)](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L74-L92) ignores return value by [_holderTokens[to].add(tokenId)](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L81)

../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L74-L92


## shadowing-local
Impact: Low
Confidence: High
 - [ ] ID-15
[ERC721Rarible.__ERC721Rarible_init(string,string,string,string,address,address,address).baseURI](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L12) shadows:
	- [ERC721Upgradeable.baseURI()](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L169-L171) (function)

../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L12


 - [ ] ID-16
[ERC721Rarible.__ERC721Rarible_init_unchained(string,string,string,string,address,address,address).baseURI](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L17) shadows:
	- [ERC721Upgradeable.baseURI()](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L169-L171) (function)

../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L17


 - [ ] ID-17
[ERC721Rarible.__ERC721Rarible_init_unchained(string,string,string,string,address,address,address)._name](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L17) shadows:
	- [ERC721Upgradeable._name](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L47) (state variable)

../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L17


 - [ ] ID-18
[ERC721Rarible.__ERC721Rarible_init_unchained(string,string,string,string,address,address,address).contractURI](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L17) shadows:
	- [HasContractURI.contractURI](../../../../tokens/contracts/HasContractURI.sol#L9) (state variable)

../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L17


 - [ ] ID-19
[ERC721Rarible.__ERC721Rarible_init(string,string,string,string,address,address,address)._symbol](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L12) shadows:
	- [ERC721Upgradeable._symbol](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L50) (state variable)

../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L12


 - [ ] ID-20
[ERC721Rarible.__ERC721Rarible_init(string,string,string,string,address,address,address)._name](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L12) shadows:
	- [ERC721Upgradeable._name](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L47) (state variable)

../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L12


 - [ ] ID-21
[ERC721Base.isApprovedForAll(address,address).owner](../../../../tokens/contracts/erc-721/ERC721Base.sol#L22) shadows:
	- [OwnableUpgradeable.owner()](../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L41-L43) (function)

../../../../tokens/contracts/erc-721/ERC721Base.sol#L22


 - [ ] ID-22
[ERC721Rarible.__ERC721Rarible_init_unchained(string,string,string,string,address,address,address)._symbol](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L17) shadows:
	- [ERC721Upgradeable._symbol](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L50) (state variable)

../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L17


 - [ ] ID-23
[ERC721Rarible.__ERC721Rarible_init(string,string,string,string,address,address,address).contractURI](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L12) shadows:
	- [HasContractURI.contractURI](../../../../tokens/contracts/HasContractURI.sol#L9) (state variable)

../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L12


## calls-loop
Impact: Low
Confidence: Medium
 - [ ] ID-24
[ERC1271Validator.validate1271(address,bytes32,bytes)](../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L16-L33) has external calls inside a loop: [require(bool,string)(ERC1271(signer).isValidSignature(hash,signature) == MAGICVALUE,SIGNATURE_ERROR)](../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L25-L28)

../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L16-L33


## reentrancy-benign
Impact: Low
Confidence: Medium
 - [ ] ID-25
Reentrancy in [ERC721Lazy.mintAndTransfer(LibERC721LazyMint.Mint721Data,address)](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L52-L72):
	External calls:
	- [_safeMint(to,data.tokenId)](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L68)
		- [returndata = to.functionCall(abi.encodeWithSelector(IERC721ReceiverUpgradeable(to).onERC721Received.selector,_msgSender(),from,tokenId,_data),ERC721: transfer to non ERC721Receiver implementer)](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L463-L469)
		- [(success,returndata) = target.call{value: value}(data)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L119)
	External calls sending eth:
	- [_safeMint(to,data.tokenId)](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L68)
		- [(success,returndata) = target.call{value: value}(data)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L119)
	State variables written after the call(s):
	- [_setTokenURI(data.tokenId,data.tokenURI)](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L71)
		- [_tokenURIs[tokenId] = _tokenURI](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L435)
	- [_saveRoyalties(data.tokenId,data.royalties)](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L69)
		- [royalties[id].push(_royalties[i])](../../../../node_modules/@rarible/royalties/contracts/impl/AbstractRoyalties.sol#L16)

../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L52-L72


 - [ ] ID-26
Reentrancy in [ERC721Rarible.__ERC721Rarible_init_unchained(string,string,string,string,address,address,address)](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L17-L33):
	External calls:
	- [__OperatorFilterer_init_unchained(subscribeTo)](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L28)
		- [IOperatorFilterRegistry(OPERATOR_FILTER_REGISTRY()).registerAndSubscribe(address(this),subscribeTo)](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L38)
	State variables written after the call(s):
	- [_setDefaultApproval(transferProxy,true)](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L31)
		- [defaultApprovals[operator] = hasApproval](../../../../tokens/contracts/erc-721/ERC721DefaultApproval.sol#L13)
	- [_setDefaultApproval(lazyTransferProxy,true)](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L32)
		- [defaultApprovals[operator] = hasApproval](../../../../tokens/contracts/erc-721/ERC721DefaultApproval.sol#L13)

../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L17-L33


## reentrancy-events
Impact: Low
Confidence: Medium
 - [ ] ID-27
Reentrancy in [ERC721Rarible.__ERC721Rarible_init_unchained(string,string,string,string,address,address,address)](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L17-L33):
	External calls:
	- [__OperatorFilterer_init_unchained(subscribeTo)](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L28)
		- [IOperatorFilterRegistry(OPERATOR_FILTER_REGISTRY()).registerAndSubscribe(address(this),subscribeTo)](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L38)
	Event emitted after the call(s):
	- [DefaultApproval(operator,hasApproval)](../../../../tokens/contracts/erc-721/ERC721DefaultApproval.sol#L14)
		- [_setDefaultApproval(lazyTransferProxy,true)](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L32)
	- [DefaultApproval(operator,hasApproval)](../../../../tokens/contracts/erc-721/ERC721DefaultApproval.sol#L14)
		- [_setDefaultApproval(transferProxy,true)](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L31)

../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L17-L33


 - [ ] ID-28
Reentrancy in [ERC721Rarible.__ERC721Rarible_init(string,string,string,string,address,address,address)](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L12-L15):
	External calls:
	- [__ERC721Rarible_init_unchained(_name,_symbol,baseURI,contractURI,transferProxy,lazyTransferProxy,subscribeTo)](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L13)
		- [IOperatorFilterRegistry(OPERATOR_FILTER_REGISTRY()).registerAndSubscribe(address(this),subscribeTo)](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L38)
	Event emitted after the call(s):
	- [CreateERC721Rarible(_msgSender(),_name,_symbol)](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L14)

../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L12-L15


 - [ ] ID-29
Reentrancy in [ERC721Lazy.mintAndTransfer(LibERC721LazyMint.Mint721Data,address)](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L52-L72):
	External calls:
	- [_safeMint(to,data.tokenId)](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L68)
		- [returndata = to.functionCall(abi.encodeWithSelector(IERC721ReceiverUpgradeable(to).onERC721Received.selector,_msgSender(),from,tokenId,_data),ERC721: transfer to non ERC721Receiver implementer)](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L463-L469)
		- [(success,returndata) = target.call{value: value}(data)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L119)
	External calls sending eth:
	- [_safeMint(to,data.tokenId)](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L68)
		- [(success,returndata) = target.call{value: value}(data)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L119)
	Event emitted after the call(s):
	- [Creators(tokenId,_creators)](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L104)
		- [_saveCreators(data.tokenId,data.creators)](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L70)
	- [RoyaltiesSet(id,_royalties)](../../../../node_modules/@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol#L18)
		- [_saveRoyalties(data.tokenId,data.royalties)](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L69)

../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L52-L72


## assembly
Impact: Informational
Confidence: High
 - [ ] ID-30
[EIP712Upgradeable._getChainId()](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L93-L99) uses assembly
	- [INLINE ASM](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L96-L98)

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L93-L99


 - [ ] ID-31
[AddressUpgradeable.isContract(address)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L26-L35) uses assembly
	- [INLINE ASM](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L33)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L26-L35


 - [ ] ID-32
[LibSignature.recover(bytes32,bytes)](../../../../node_modules/@rarible/lib-signature/contracts/LibSignature.sol#L20-L45) uses assembly
	- [INLINE ASM](../../../../node_modules/@rarible/lib-signature/contracts/LibSignature.sol#L38-L42)

../../../../node_modules/@rarible/lib-signature/contracts/LibSignature.sol#L20-L45


 - [ ] ID-33
[AddressUpgradeable._verifyCallResult(bool,bytes,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L147-L164) uses assembly
	- [INLINE ASM](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L156-L159)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L147-L164


## pragma
Impact: Informational
Confidence: High
 - [ ] ID-34
Different versions of Solidity are used:
	- Version used: ['0.7.6', '>=0.4.24<0.8.0', '>=0.6.0<0.8.0', '>=0.6.2<0.8.0', '^0.7.0', '^0.7.6']
	- [0.7.6](../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L3)
	- [0.7.6](../../../../tokens/contracts/HasContractURI.sol#L3)
	- [0.7.6](../../../../tokens/contracts/LibURI.sol#L3)
	- [0.7.6](../../../../tokens/contracts/Mint721Validator.sol#L3)
	- [0.7.6](../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L3)
	- [0.7.6](../../../../tokens/contracts/erc-721/ERC721Base.sol#L3)
	- [0.7.6](../../../../tokens/contracts/erc-721/ERC721DefaultApproval.sol#L3)
	- [0.7.6](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L3)
	- [0.7.6](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L3)
	- [>=0.4.24<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/proxy/Initializable.sol#L4)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/IERC165Upgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableMapUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../tokens/contracts/erc-721/ERC721BurnableUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L3)
	- [>=0.6.2<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721EnumerableUpgradeable.sol#L3)
	- [>=0.6.2<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721MetadataUpgradeable.sol#L3)
	- [>=0.6.2<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol#L3)
	- [>=0.6.2<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L3)
	- [>=0.6.2<0.8.0](../../../../node_modules/@rarible/lazy-mint/contracts/erc-721/IERC721LazyMint.sol#L3)
	- [>=0.6.2<0.8.0](../../../../node_modules/@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol#L3)
	- [>=0.6.2<0.8.0](../../../../node_modules/@rarible/lib-part/contracts/LibPart.sol#L3)
	- [>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties-upgradeable/contracts/RoyaltiesV2Upgradeable.sol#L3)
	- [>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/IERC2981.sol#L3)
	- [>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L3)
	- [>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/LibRoyaltiesV2.sol#L3)
	- [>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/RoyaltiesV2.sol#L3)
	- [>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/impl/AbstractRoyalties.sol#L3)
	- [>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol#L3)
	- [^0.7.0](../../../../node_modules/@rarible/lib-signature/contracts/LibSignature.sol#L3)
	- [^0.7.6](../../../../tokens/contracts/operator-filter-registry/IOperatorFilterRegistry.sol#L2)
	- [^0.7.6](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L2)
	- [v2](../../../../node_modules/@rarible/lazy-mint/contracts/erc-721/IERC721LazyMint.sol#L4)
	- [v2](../../../../node_modules/@rarible/royalties-upgradeable/contracts/RoyaltiesV2Upgradeable.sol#L4)
	- [v2](../../../../node_modules/@rarible/royalties/contracts/RoyaltiesV2.sol#L4)
	- [v2](../../../../node_modules/@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol#L4)
	- [v2](../../../../tokens/contracts/erc-721/ERC721Base.sol#L4)
	- [v2](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L4)
	- [v2](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L4)

../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L3


## dead-code
Impact: Informational
Confidence: Medium
 - [ ] ID-35
[SafeMathUpgradeable.sub(uint256,uint256,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L170-L173) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L170-L173


 - [ ] ID-36
[ContextUpgradeable._msgData()](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L27-L30) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L27-L30


 - [ ] ID-37
[AddressUpgradeable.functionCallWithValue(address,bytes,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L104-L106) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L104-L106


 - [ ] ID-38
[SafeMathUpgradeable.trySub(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L35-L38) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L35-L38


 - [ ] ID-39
[ERC721Upgradeable._mint(address,uint256)](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L344-L356) is never used and should be removed

../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L344-L356


 - [ ] ID-40
[EnumerableSetUpgradeable.add(EnumerableSetUpgradeable.AddressSet,address)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L201-L203) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L201-L203


 - [ ] ID-41
[HasContractURI._setContractURI(string)](../../../../tokens/contracts/HasContractURI.sol#L25-L27) is never used and should be removed

../../../../tokens/contracts/HasContractURI.sol#L25-L27


 - [ ] ID-42
[EIP712Upgradeable.__EIP712_init(string,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L44-L46) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L44-L46


 - [ ] ID-43
[EnumerableMapUpgradeable._get(EnumerableMapUpgradeable.Map,bytes32)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableMapUpgradeable.sol#L163-L167) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableMapUpgradeable.sol#L163-L167


 - [ ] ID-44
[SafeMathUpgradeable.div(uint256,uint256,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L190-L193) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L190-L193


 - [ ] ID-45
[EnumerableSetUpgradeable.remove(EnumerableSetUpgradeable.AddressSet,address)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L211-L213) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L211-L213


 - [ ] ID-46
[AddressUpgradeable.functionCall(address,bytes)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L79-L81) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L79-L81


 - [ ] ID-47
[ERC721Upgradeable.__ERC721_init(string,string)](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L98-L102) is never used and should be removed

../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L98-L102


 - [ ] ID-48
[AddressUpgradeable.sendValue(address,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L53-L59) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L53-L59


 - [ ] ID-49
[EnumerableMapUpgradeable.get(EnumerableMapUpgradeable.UintToAddressMap,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableMapUpgradeable.sol#L253-L255) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableMapUpgradeable.sol#L253-L255


 - [ ] ID-50
[SafeMathUpgradeable.tryMul(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L45-L53) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L45-L53


 - [ ] ID-51
[EnumerableSetUpgradeable.remove(EnumerableSetUpgradeable.Bytes32Set,bytes32)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L157-L159) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L157-L159


 - [ ] ID-52
[AddressUpgradeable.functionStaticCall(address,bytes)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L129-L131) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L129-L131


 - [ ] ID-53
[OwnableUpgradeable.__Ownable_init()](../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L27-L30) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L27-L30


 - [ ] ID-54
[SafeMathUpgradeable.mod(uint256,uint256,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L210-L213) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L210-L213


 - [ ] ID-55
[EnumerableSetUpgradeable.contains(EnumerableSetUpgradeable.Bytes32Set,bytes32)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L164-L166) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L164-L166


 - [ ] ID-56
[EnumerableMapUpgradeable._tryGet(EnumerableMapUpgradeable.Map,bytes32)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableMapUpgradeable.sol#L150-L154) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableMapUpgradeable.sol#L150-L154


 - [ ] ID-57
[ERC165Upgradeable.__ERC165_init()](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L25-L27) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L25-L27


 - [ ] ID-58
[EnumerableSetUpgradeable.contains(EnumerableSetUpgradeable.AddressSet,address)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L218-L220) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L218-L220


 - [ ] ID-59
[EnumerableSetUpgradeable.add(EnumerableSetUpgradeable.Bytes32Set,bytes32)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L147-L149) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L147-L149


 - [ ] ID-60
[SafeMathUpgradeable.mul(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L116-L121) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L116-L121


 - [ ] ID-61
[SafeMathUpgradeable.div(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L135-L138) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L135-L138


 - [ ] ID-62
[SafeMathUpgradeable.tryAdd(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L24-L28) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L24-L28


 - [ ] ID-63
[ERC721BurnableUpgradeable.__ERC721Burnable_init()](../../../../tokens/contracts/erc-721/ERC721BurnableUpgradeable.sol#L14-L18) is never used and should be removed

../../../../tokens/contracts/erc-721/ERC721BurnableUpgradeable.sol#L14-L18


 - [ ] ID-64
[EnumerableSetUpgradeable.length(EnumerableSetUpgradeable.Bytes32Set)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L171-L173) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L171-L173


 - [ ] ID-65
[EnumerableSetUpgradeable.at(EnumerableSetUpgradeable.Bytes32Set,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L185-L187) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L185-L187


 - [ ] ID-66
[EnumerableSetUpgradeable.length(EnumerableSetUpgradeable.AddressSet)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L225-L227) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L225-L227


 - [ ] ID-67
[ERC1271.returnIsValidSignatureMagicNumber(bool)](../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L22-L24) is never used and should be removed

../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L22-L24


 - [ ] ID-68
[AddressUpgradeable.functionStaticCall(address,bytes,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L139-L145) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L139-L145


 - [ ] ID-69
[SafeMathUpgradeable.tryDiv(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L60-L63) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L60-L63


 - [ ] ID-70
[SafeMathUpgradeable.mod(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L152-L155) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L152-L155


 - [ ] ID-71
[SafeMathUpgradeable.tryMod(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L70-L73) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L70-L73


 - [ ] ID-72
[SafeMathUpgradeable.sub(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L101-L104) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L101-L104


 - [ ] ID-73
[EnumerableSetUpgradeable.contains(EnumerableSetUpgradeable.UintSet,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L273-L275) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L273-L275


 - [ ] ID-74
[EnumerableMapUpgradeable.tryGet(EnumerableMapUpgradeable.UintToAddressMap,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableMapUpgradeable.sol#L241-L244) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableMapUpgradeable.sol#L241-L244


 - [ ] ID-75
[ContextUpgradeable.__Context_init()](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L17-L19) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L17-L19


 - [ ] ID-76
[EnumerableSetUpgradeable.at(EnumerableSetUpgradeable.AddressSet,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L239-L241) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L239-L241


 - [ ] ID-77
[LibRoyalties2981.calculateRoyalties(address,uint256)](../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L15-L26) is never used and should be removed

../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L15-L26


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-78
Pragma version[0.7.6](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L3) allows old versions

../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L3


 - [ ] ID-79
Pragma version[0.7.6](../../../../tokens/contracts/erc-721/ERC721Base.sol#L3) allows old versions

../../../../tokens/contracts/erc-721/ERC721Base.sol#L3


 - [ ] ID-80
Pragma version[>=0.6.0<0.8.0](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L3) is too complex

../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L3


 - [ ] ID-81
Pragma version[^0.7.6](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L2) allows old versions

../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L2


 - [ ] ID-82
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L3) is too complex

../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L3


 - [ ] ID-83
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721MetadataUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721MetadataUpgradeable.sol#L3


 - [ ] ID-84
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L3


 - [ ] ID-85
Pragma version[>=0.4.24<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/proxy/Initializable.sol#L4) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/proxy/Initializable.sol#L4


 - [ ] ID-86
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L3


 - [ ] ID-87
Pragma version[^0.7.6](../../../../tokens/contracts/operator-filter-registry/IOperatorFilterRegistry.sol#L2) allows old versions

../../../../tokens/contracts/operator-filter-registry/IOperatorFilterRegistry.sol#L2


 - [ ] ID-88
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L3


 - [ ] ID-89
Pragma version[0.7.6](../../../../tokens/contracts/LibURI.sol#L3) allows old versions

../../../../tokens/contracts/LibURI.sol#L3


 - [ ] ID-90
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/IERC2981.sol#L3) is too complex

../../../../node_modules/@rarible/royalties/contracts/IERC2981.sol#L3


 - [ ] ID-91
Pragma version[0.7.6](../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L3) allows old versions

../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L3


 - [ ] ID-92
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/IERC165Upgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/IERC165Upgradeable.sol#L3


 - [ ] ID-93
Pragma version[^0.7.0](../../../../node_modules/@rarible/lib-signature/contracts/LibSignature.sol#L3) allows old versions

../../../../node_modules/@rarible/lib-signature/contracts/LibSignature.sol#L3


 - [ ] ID-94
Pragma version[0.7.6](../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L3) allows old versions

../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L3


 - [ ] ID-95
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721EnumerableUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721EnumerableUpgradeable.sol#L3


 - [ ] ID-96
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/LibRoyaltiesV2.sol#L3) is too complex

../../../../node_modules/@rarible/royalties/contracts/LibRoyaltiesV2.sol#L3


 - [ ] ID-97
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/lazy-mint/contracts/erc-721/IERC721LazyMint.sol#L3) is too complex

../../../../node_modules/@rarible/lazy-mint/contracts/erc-721/IERC721LazyMint.sol#L3


 - [ ] ID-98
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol#L3


 - [ ] ID-99
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L3


 - [ ] ID-100
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol#L3


 - [ ] ID-101
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol#L3) is too complex

../../../../node_modules/@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol#L3


 - [ ] ID-102
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/lib-part/contracts/LibPart.sol#L3) is too complex

../../../../node_modules/@rarible/lib-part/contracts/LibPart.sol#L3


 - [ ] ID-103
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol#L3


 - [ ] ID-104
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableMapUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableMapUpgradeable.sol#L3


 - [ ] ID-105
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L3


 - [ ] ID-106
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties-upgradeable/contracts/RoyaltiesV2Upgradeable.sol#L3) is too complex

../../../../node_modules/@rarible/royalties-upgradeable/contracts/RoyaltiesV2Upgradeable.sol#L3


 - [ ] ID-107
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L3


 - [ ] ID-108
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/EnumerableSetUpgradeable.sol#L3


 - [ ] ID-109
Pragma version[0.7.6](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L3) allows old versions

../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L3


 - [ ] ID-110
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol#L3) is too complex

../../../../node_modules/@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol#L3


 - [ ] ID-111
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/impl/AbstractRoyalties.sol#L3) is too complex

../../../../node_modules/@rarible/royalties/contracts/impl/AbstractRoyalties.sol#L3


 - [ ] ID-112
solc-0.7.6 is not recommended for deployment

 - [ ] ID-113
Pragma version[0.7.6](../../../../tokens/contracts/HasContractURI.sol#L3) allows old versions

../../../../tokens/contracts/HasContractURI.sol#L3


 - [ ] ID-114
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/RoyaltiesV2.sol#L3) is too complex

../../../../node_modules/@rarible/royalties/contracts/RoyaltiesV2.sol#L3


 - [ ] ID-115
Pragma version[0.7.6](../../../../tokens/contracts/erc-721/ERC721DefaultApproval.sol#L3) allows old versions

../../../../tokens/contracts/erc-721/ERC721DefaultApproval.sol#L3


 - [ ] ID-116
Pragma version[0.7.6](../../../../tokens/contracts/Mint721Validator.sol#L3) allows old versions

../../../../tokens/contracts/Mint721Validator.sol#L3


 - [ ] ID-117
Pragma version[>=0.6.0<0.8.0](../../../../tokens/contracts/erc-721/ERC721BurnableUpgradeable.sol#L3) is too complex

../../../../tokens/contracts/erc-721/ERC721BurnableUpgradeable.sol#L3


## low-level-calls
Impact: Informational
Confidence: High
 - [ ] ID-118
Low level call in [AddressUpgradeable.functionStaticCall(address,bytes,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L139-L145):
	- [(success,returndata) = target.staticcall(data)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L143)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L139-L145


 - [ ] ID-119
Low level call in [AddressUpgradeable.functionCallWithValue(address,bytes,uint256,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L114-L121):
	- [(success,returndata) = target.call{value: value}(data)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L119)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L114-L121


 - [ ] ID-120
Low level call in [AddressUpgradeable.sendValue(address,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L53-L59):
	- [(success) = recipient.call{value: amount}()](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L57)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L53-L59


## naming-convention
Impact: Informational
Confidence: High
 - [ ] ID-121
Parameter [LibURI.checkPrefix(string,string)._tokenURI](../../../../tokens/contracts/LibURI.sol#L7) is not in mixedCase

../../../../tokens/contracts/LibURI.sol#L7


 - [ ] ID-122
Parameter [ERC721Lazy.updateAccount(uint256,address,address)._to](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L107) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L107


 - [ ] ID-123
Function [RoyaltiesV2Upgradeable.__RoyaltiesV2Upgradeable_init_unchained()](../../../../node_modules/@rarible/royalties-upgradeable/contracts/RoyaltiesV2Upgradeable.sol#L11-L13) is not in mixedCase

../../../../node_modules/@rarible/royalties-upgradeable/contracts/RoyaltiesV2Upgradeable.sol#L11-L13


 - [ ] ID-124
Variable [HasContractURI.__gap](../../../../tokens/contracts/HasContractURI.sol#L29) is not in mixedCase

../../../../tokens/contracts/HasContractURI.sol#L29


 - [ ] ID-125
Parameter [ERC721Lazy.updateAccount(uint256,address,address)._id](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L107) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L107


 - [ ] ID-126
Function [ERC721Rarible.__ERC721Rarible_init_unchained(string,string,string,string,address,address,address)](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L17-L33) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L17-L33


 - [ ] ID-127
Parameter [HasContractURI.__HasContractURI_init_unchained(string)._contractURI](../../../../tokens/contracts/HasContractURI.sol#L16) is not in mixedCase

../../../../tokens/contracts/HasContractURI.sol#L16


 - [ ] ID-128
Variable [EIP712Upgradeable.__gap](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L120) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L120


 - [ ] ID-129
Parameter [RoyaltiesV2Impl.royaltyInfo(uint256,uint256)._salePrice](../../../../node_modules/@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol#L25) is not in mixedCase

../../../../node_modules/@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol#L25


 - [ ] ID-130
Function [Mint721Validator.__Mint721Validator_init_unchained()](../../../../tokens/contracts/Mint721Validator.sol#L9-L11) is not in mixedCase

../../../../tokens/contracts/Mint721Validator.sol#L9-L11


 - [ ] ID-131
Parameter [ERC721Upgradeable.safeTransferFrom(address,address,uint256,bytes)._data](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L256) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L256


 - [ ] ID-132
Variable [ERC1271Validator.__gap](../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L34) is not in mixedCase

../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L34


 - [ ] ID-133
Variable [EIP712Upgradeable._HASHED_NAME](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L27) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L27


 - [ ] ID-134
Function [EIP712Upgradeable.__EIP712_init(string,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L44-L46) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L44-L46


 - [ ] ID-135
Variable [ERC721Upgradeable._tokenOwners](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L38) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L38


 - [ ] ID-136
Variable [ContextUpgradeable.__gap](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L31) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L31


 - [ ] ID-137
Variable [ERC721Upgradeable.__gap](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L495) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L495


 - [ ] ID-138
Function [ERC721Rarible.__ERC721Rarible_init(string,string,string,string,address,address,address)](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L12-L15) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L12-L15


 - [ ] ID-139
Function [ERC721BurnableUpgradeable.__ERC721Burnable_init()](../../../../tokens/contracts/erc-721/ERC721BurnableUpgradeable.sol#L14-L18) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721BurnableUpgradeable.sol#L14-L18


 - [ ] ID-140
Function [OwnableUpgradeable.__Ownable_init()](../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L27-L30) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L27-L30


 - [ ] ID-141
Function [OperatorFiltererUpgradeable.__OperatorFilterer_init_unchained(address)](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L33-L40) is not in mixedCase

../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L33-L40


 - [ ] ID-142
Parameter [ERC721Lazy.getCreators(uint256)._id](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L112) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L112


 - [ ] ID-143
Function [ERC721BurnableUpgradeable.__ERC721Burnable_init_unchained()](../../../../tokens/contracts/erc-721/ERC721BurnableUpgradeable.sol#L20-L21) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721BurnableUpgradeable.sol#L20-L21


 - [ ] ID-144
Variable [ERC721BurnableUpgradeable.__gap](../../../../tokens/contracts/erc-721/ERC721BurnableUpgradeable.sol#L40) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721BurnableUpgradeable.sol#L40


 - [ ] ID-145
Variable [OwnableUpgradeable.__gap](../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L74) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L74


 - [ ] ID-146
Function [ERC721Upgradeable.__ERC721_init_unchained(string,string)](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L104-L112) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L104-L112


 - [ ] ID-147
Parameter [ERC721Rarible.__ERC721Rarible_init_unchained(string,string,string,string,address,address,address)._name](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L17) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L17


 - [ ] ID-148
Function [ERC165Upgradeable.__ERC165_init_unchained()](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L29-L33) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L29-L33


 - [ ] ID-149
Function [ContextUpgradeable.__Context_init_unchained()](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L21-L22) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L21-L22


 - [ ] ID-150
Function [ERC721Lazy.__ERC721Lazy_init_unchained()](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L25-L27) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L25-L27


 - [ ] ID-151
Parameter [ERC721Lazy.updateAccount(uint256,address,address)._from](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L107) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L107


 - [ ] ID-152
Function [EIP712Upgradeable._EIP712VersionHash()](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L117-L119) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L117-L119


 - [ ] ID-153
Variable [EIP712Upgradeable._HASHED_VERSION](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L28) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L28


 - [ ] ID-154
Function [HasContractURI.__HasContractURI_init_unchained(string)](../../../../tokens/contracts/HasContractURI.sol#L16-L19) is not in mixedCase

../../../../tokens/contracts/HasContractURI.sol#L16-L19


 - [ ] ID-155
Variable [ERC721Base.__gap](../../../../tokens/contracts/erc-721/ERC721Base.sol#L84) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721Base.sol#L84


 - [ ] ID-156
Function [EIP712Upgradeable._EIP712NameHash()](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L107-L109) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L107-L109


 - [ ] ID-157
Function [OperatorFiltererUpgradeable.OPERATOR_FILTER_REGISTRY()](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L28-L30) is not in mixedCase

../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L28-L30


 - [ ] ID-158
Parameter [ERC721Rarible.__ERC721Rarible_init_unchained(string,string,string,string,address,address,address)._symbol](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L17) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L17


 - [ ] ID-159
Variable [ERC165Upgradeable.__gap](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L59) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L59


 - [ ] ID-160
Function [OwnableUpgradeable.__Ownable_init_unchained()](../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L32-L36) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L32-L36


 - [ ] ID-161
Parameter [ERC721Rarible.__ERC721Rarible_init(string,string,string,string,address,address,address)._name](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L12) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L12


 - [ ] ID-162
Variable [ERC721Lazy.__gap](../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L116) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721Lazy.sol#L116


 - [ ] ID-163
Variable [ERC721Upgradeable._holderTokens](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L35) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L35


 - [ ] ID-164
Variable [ERC721Rarible.__gap](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L35) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L35


 - [ ] ID-165
Variable [ERC721DefaultApproval.__gap](../../../../tokens/contracts/erc-721/ERC721DefaultApproval.sol#L24) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721DefaultApproval.sol#L24


 - [ ] ID-166
Function [ContextUpgradeable.__Context_init()](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L17-L19) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L17-L19


 - [ ] ID-167
Function [ERC165Upgradeable.__ERC165_init()](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L25-L27) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L25-L27


 - [ ] ID-168
Parameter [ERC721Rarible.__ERC721Rarible_init(string,string,string,string,address,address,address)._symbol](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L12) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L12


 - [ ] ID-169
Variable [Mint721Validator.__gap](../../../../tokens/contracts/Mint721Validator.sol#L16) is not in mixedCase

../../../../tokens/contracts/Mint721Validator.sol#L16


 - [ ] ID-170
Function [EIP712Upgradeable.__EIP712_init_unchained(string,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L48-L53) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L48-L53


 - [ ] ID-171
Function [ERC721Upgradeable.__ERC721_init(string,string)](../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L98-L102) is not in mixedCase

../../../../tokens/contracts/erc-721/ERC721Upgradeable.sol#L98-L102


## redundant-statements
Impact: Informational
Confidence: High
 - [ ] ID-172
Redundant expression "[this](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L94)" in[EIP712Upgradeable](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L25-L121)

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L94


 - [ ] ID-173
Redundant expression "[this](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L28)" in[ContextUpgradeable](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L16-L32)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L28


## too-many-digits
Impact: Informational
Confidence: Medium
 - [ ] ID-174
[LibRoyalties2981.slitherConstructorConstantVariables()](../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L7-L27) uses literals with too many digits:
	- [_WEIGHT_VALUE = 1000000](../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L12)

../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L7-L27


 - [ ] ID-175
[ERC1271.slitherConstructorConstantVariables()](../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L5-L26) uses literals with too many digits:
	- [ERC1271_RETURN_INVALID_SIGNATURE = 0x00000000](../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L9)

../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L5-L26


## unimplemented-functions
Impact: Informational
Confidence: High
 - [ ] ID-176
[ERC1271](../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L5-L26) does not implement functions:
	- [ERC1271.isValidSignature(bytes32,bytes)](../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L20)

../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L5-L26


## unused-state
Impact: Informational
Confidence: High
 - [ ] ID-177
[ERC721Rarible.__gap](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L35) is never used in [ERC721Rarible](../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L8-L36)

../../../../tokens/contracts/erc-721/ERC721Rarible.sol#L35


 - [ ] ID-178
[LibRoyalties2981._INTERFACE_ID_ROYALTIES](../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L11) is never used in [LibRoyalties2981](../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L7-L27)

../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L11


 - [ ] ID-179
[LibERC721LazyMint._INTERFACE_ID_MINT_AND_TRANSFER](../../../../node_modules/@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol#L9) is never used in [LibERC721LazyMint](../../../../node_modules/@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol#L7-L39)

../../../../node_modules/@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol#L9


