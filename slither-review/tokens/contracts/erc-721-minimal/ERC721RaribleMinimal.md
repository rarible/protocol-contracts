**THIS CHECKLIST IS NOT COMPLETE**. Use `--show-ignored-findings` to show all the results.
Summary
 - [shadowing-state](#shadowing-state) (3 results) (High)
 - [uninitialized-local](#uninitialized-local) (2 results) (Medium)
 - [unused-return](#unused-return) (1 results) (Medium)
 - [shadowing-local](#shadowing-local) (13 results) (Low)
 - [reentrancy-benign](#reentrancy-benign) (4 results) (Low)
 - [reentrancy-events](#reentrancy-events) (4 results) (Low)
 - [assembly](#assembly) (5 results) (Informational)
 - [pragma](#pragma) (1 results) (Informational)
 - [dead-code](#dead-code) (33 results) (Informational)
 - [solc-version](#solc-version) (40 results) (Informational)
 - [low-level-calls](#low-level-calls) (3 results) (Informational)
 - [naming-convention](#naming-convention) (57 results) (Informational)
 - [redundant-statements](#redundant-statements) (2 results) (Informational)
 - [too-many-digits](#too-many-digits) (2 results) (Informational)
 - [unimplemented-functions](#unimplemented-functions) (1 results) (Informational)
 - [unused-state](#unused-state) (2 results) (Informational)
## shadowing-state
Impact: High
Confidence: High
 - [ ] ID-0
[ERC721LazyMinimal._INTERFACE_ID_ERC721](../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L18) shadows:
	- [ERC721UpgradeableMinimal._INTERFACE_ID_ERC721](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L54)

../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L18


 - [ ] ID-1
[ERC721LazyMinimal._INTERFACE_ID_ERC721_METADATA](../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L19) shadows:
	- [ERC721UpgradeableMinimal._INTERFACE_ID_ERC721_METADATA](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L63)

../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L19


 - [ ] ID-2
[ERC721LazyMinimal._INTERFACE_ID_ERC165](../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L17) shadows:
	- [ERC165Upgradeable._INTERFACE_ID_ERC165](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L18)

../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L17


## uninitialized-local
Impact: Medium
Confidence: Medium
 - [ ] ID-3
[LibRoyalties2981.calculateRoyalties(address,uint256).result](../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L16) is a local variable never initialized

../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L16


 - [ ] ID-4
[ERC1271Validator.validate1271(address,bytes32,bytes).signerFromSig](../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L19) is a local variable never initialized

../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L19


## unused-return
Impact: Medium
Confidence: Medium
 - [ ] ID-5
[ERC721UpgradeableMinimal._checkOnERC721Received(address,address,uint256,bytes)](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L401-L422) ignores return value by [IERC721ReceiverUpgradeable(to).onERC721Received(_msgSender(),from,tokenId,_data)](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L408-L418)

../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L401-L422


## shadowing-local
Impact: Low
Confidence: High
 - [ ] ID-6
[ERC721RaribleMinimal.__ERC721Rarible_init(string,string,string,string,address,address,address).contractURI](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L21) shadows:
	- [HasContractURI.contractURI](../../../../tokens/contracts/HasContractURI.sol#L9) (state variable)

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L21


 - [ ] ID-7
[ERC721RaribleMinimal.__ERC721Rarible_init_unchained(string,string,string,string,address,address,address)._name](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L28) shadows:
	- [ERC721UpgradeableMinimal._name](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L23) (state variable)

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L28


 - [ ] ID-8
[ERC721RaribleMinimal.__ERC721Rarible_init(string,string,string,string,address,address,address)._symbol](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L21) shadows:
	- [ERC721UpgradeableMinimal._symbol](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L26) (state variable)

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L21


 - [ ] ID-9
[ERC721RaribleMinimal.__ERC721Rarible_init_unchained(string,string,string,string,address,address,address).contractURI](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L28) shadows:
	- [HasContractURI.contractURI](../../../../tokens/contracts/HasContractURI.sol#L9) (state variable)

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L28


 - [ ] ID-10
[ERC721RaribleMinimal.__ERC721RaribleUser_init(string,string,string,string,address[],address,address,address)._symbol](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L14) shadows:
	- [ERC721UpgradeableMinimal._symbol](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L26) (state variable)

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L14


 - [ ] ID-11
[ERC721RaribleMinimal.__ERC721RaribleUser_init(string,string,string,string,address[],address,address,address)._name](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L14) shadows:
	- [ERC721UpgradeableMinimal._name](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L23) (state variable)

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L14


 - [ ] ID-12
[ERC721BaseMinimal.isApprovedForAll(address,address).owner](../../../../tokens/contracts/erc-721-minimal/ERC721BaseMinimal.sol#L21) shadows:
	- [OwnableUpgradeable.owner()](../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L41-L43) (function)

../../../../tokens/contracts/erc-721-minimal/ERC721BaseMinimal.sol#L21


 - [ ] ID-13
[ERC721RaribleMinimal.__ERC721RaribleUser_init(string,string,string,string,address[],address,address,address).baseURI](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L14) shadows:
	- [ERC721URI.baseURI()](../../../../tokens/contracts/erc-721-minimal/ERC721URI.sol#L50-L52) (function)

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L14


 - [ ] ID-14
[ERC721RaribleMinimal.__ERC721Rarible_init_unchained(string,string,string,string,address,address,address)._symbol](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L28) shadows:
	- [ERC721UpgradeableMinimal._symbol](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L26) (state variable)

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L28


 - [ ] ID-15
[ERC721RaribleMinimal.__ERC721Rarible_init(string,string,string,string,address,address,address)._name](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L21) shadows:
	- [ERC721UpgradeableMinimal._name](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L23) (state variable)

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L21


 - [ ] ID-16
[ERC721RaribleMinimal.__ERC721Rarible_init_unchained(string,string,string,string,address,address,address).baseURI](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L28) shadows:
	- [ERC721URI.baseURI()](../../../../tokens/contracts/erc-721-minimal/ERC721URI.sol#L50-L52) (function)

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L28


 - [ ] ID-17
[ERC721RaribleMinimal.__ERC721RaribleUser_init(string,string,string,string,address[],address,address,address).contractURI](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L14) shadows:
	- [HasContractURI.contractURI](../../../../tokens/contracts/HasContractURI.sol#L9) (state variable)

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L14


 - [ ] ID-18
[ERC721RaribleMinimal.__ERC721Rarible_init(string,string,string,string,address,address,address).baseURI](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L21) shadows:
	- [ERC721URI.baseURI()](../../../../tokens/contracts/erc-721-minimal/ERC721URI.sol#L50-L52) (function)

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L21


## reentrancy-benign
Impact: Low
Confidence: Medium
 - [ ] ID-19
Reentrancy in [ERC721RaribleMinimal.__ERC721Rarible_init(string,string,string,string,address,address,address)](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L21-L26):
	External calls:
	- [__ERC721Rarible_init_unchained(_name,_symbol,baseURI,contractURI,transferProxy,lazyTransferProxy,subscribeTo)](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L22)
		- [IOperatorFilterRegistry(OPERATOR_FILTER_REGISTRY()).registerAndSubscribe(address(this),subscribeTo)](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L38)
	State variables written after the call(s):
	- [isPrivate = false](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L24)

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L21-L26


 - [ ] ID-20
Reentrancy in [ERC721RaribleMinimal.__ERC721Rarible_init_unchained(string,string,string,string,address,address,address)](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L28-L45):
	External calls:
	- [__OperatorFilterer_init_unchained(subscribeTo)](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L40)
		- [IOperatorFilterRegistry(OPERATOR_FILTER_REGISTRY()).registerAndSubscribe(address(this),subscribeTo)](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L38)
	State variables written after the call(s):
	- [_setDefaultApproval(transferProxy,true)](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L43)
		- [defaultApprovals[operator] = hasApproval](../../../../tokens/contracts/erc-721-minimal/ERC721DefaultApprovalMinimal.sol#L13)
	- [_setDefaultApproval(lazyTransferProxy,true)](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L44)
		- [defaultApprovals[operator] = hasApproval](../../../../tokens/contracts/erc-721-minimal/ERC721DefaultApprovalMinimal.sol#L13)

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L28-L45


 - [ ] ID-21
Reentrancy in [ERC721LazyMinimal.mintAndTransfer(LibERC721LazyMint.Mint721Data,address)](../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L52-L72):
	External calls:
	- [_safeMint(to,data.tokenId)](../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L68)
		- [IERC721ReceiverUpgradeable(to).onERC721Received(_msgSender(),from,tokenId,_data)](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L408-L418)
	State variables written after the call(s):
	- [_setTokenURI(data.tokenId,data.tokenURI)](../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L71)
		- [_tokenURIs[tokenId] = _tokenURI](../../../../tokens/contracts/erc-721-minimal/ERC721URI.sol#L33)
	- [_saveRoyalties(data.tokenId,data.royalties)](../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L69)
		- [royalties[id].push(_royalties[i])](../../../../node_modules/@rarible/royalties/contracts/impl/AbstractRoyalties.sol#L16)

../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L52-L72


 - [ ] ID-22
Reentrancy in [ERC721RaribleMinimal.__ERC721RaribleUser_init(string,string,string,string,address[],address,address,address)](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L14-L19):
	External calls:
	- [__ERC721Rarible_init_unchained(_name,_symbol,baseURI,contractURI,transferProxy,lazyTransferProxy,subscribeTo)](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L15)
		- [IOperatorFilterRegistry(OPERATOR_FILTER_REGISTRY()).registerAndSubscribe(address(this),subscribeTo)](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L38)
	State variables written after the call(s):
	- [isPrivate = true](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L17)

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L14-L19


## reentrancy-events
Impact: Low
Confidence: Medium
 - [ ] ID-23
Reentrancy in [ERC721RaribleMinimal.__ERC721RaribleUser_init(string,string,string,string,address[],address,address,address)](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L14-L19):
	External calls:
	- [__ERC721Rarible_init_unchained(_name,_symbol,baseURI,contractURI,transferProxy,lazyTransferProxy,subscribeTo)](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L15)
		- [IOperatorFilterRegistry(OPERATOR_FILTER_REGISTRY()).registerAndSubscribe(address(this),subscribeTo)](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L38)
	Event emitted after the call(s):
	- [CreateERC721RaribleUser(_msgSender(),_name,_symbol)](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L18)

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L14-L19


 - [ ] ID-24
Reentrancy in [ERC721LazyMinimal.mintAndTransfer(LibERC721LazyMint.Mint721Data,address)](../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L52-L72):
	External calls:
	- [_safeMint(to,data.tokenId)](../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L68)
		- [IERC721ReceiverUpgradeable(to).onERC721Received(_msgSender(),from,tokenId,_data)](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L408-L418)
	Event emitted after the call(s):
	- [Creators(tokenId,_creators)](../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L94)
		- [_saveCreators(data.tokenId,data.creators)](../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L70)
	- [RoyaltiesSet(id,_royalties)](../../../../node_modules/@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol#L18)
		- [_saveRoyalties(data.tokenId,data.royalties)](../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L69)

../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L52-L72


 - [ ] ID-25
Reentrancy in [ERC721RaribleMinimal.__ERC721Rarible_init_unchained(string,string,string,string,address,address,address)](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L28-L45):
	External calls:
	- [__OperatorFilterer_init_unchained(subscribeTo)](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L40)
		- [IOperatorFilterRegistry(OPERATOR_FILTER_REGISTRY()).registerAndSubscribe(address(this),subscribeTo)](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L38)
	Event emitted after the call(s):
	- [DefaultApproval(operator,hasApproval)](../../../../tokens/contracts/erc-721-minimal/ERC721DefaultApprovalMinimal.sol#L14)
		- [_setDefaultApproval(lazyTransferProxy,true)](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L44)
	- [DefaultApproval(operator,hasApproval)](../../../../tokens/contracts/erc-721-minimal/ERC721DefaultApprovalMinimal.sol#L14)
		- [_setDefaultApproval(transferProxy,true)](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L43)

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L28-L45


 - [ ] ID-26
Reentrancy in [ERC721RaribleMinimal.__ERC721Rarible_init(string,string,string,string,address,address,address)](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L21-L26):
	External calls:
	- [__ERC721Rarible_init_unchained(_name,_symbol,baseURI,contractURI,transferProxy,lazyTransferProxy,subscribeTo)](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L22)
		- [IOperatorFilterRegistry(OPERATOR_FILTER_REGISTRY()).registerAndSubscribe(address(this),subscribeTo)](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L38)
	Event emitted after the call(s):
	- [CreateERC721Rarible(_msgSender(),_name,_symbol)](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L25)

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L21-L26


## assembly
Impact: Informational
Confidence: High
 - [ ] ID-27
[ERC721UpgradeableMinimal._checkOnERC721Received(address,address,uint256,bytes)](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L401-L422) uses assembly
	- [INLINE ASM](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L414-L416)

../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L401-L422


 - [ ] ID-28
[EIP712Upgradeable._getChainId()](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L93-L99) uses assembly
	- [INLINE ASM](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L96-L98)

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L93-L99


 - [ ] ID-29
[AddressUpgradeable.isContract(address)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L26-L35) uses assembly
	- [INLINE ASM](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L33)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L26-L35


 - [ ] ID-30
[LibSignature.recover(bytes32,bytes)](../../../../node_modules/@rarible/lib-signature/contracts/LibSignature.sol#L20-L45) uses assembly
	- [INLINE ASM](../../../../node_modules/@rarible/lib-signature/contracts/LibSignature.sol#L38-L42)

../../../../node_modules/@rarible/lib-signature/contracts/LibSignature.sol#L20-L45


 - [ ] ID-31
[AddressUpgradeable._verifyCallResult(bool,bytes,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L147-L164) uses assembly
	- [INLINE ASM](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L156-L159)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L147-L164


## pragma
Impact: Informational
Confidence: High
 - [ ] ID-32
Different versions of Solidity are used:
	- Version used: ['0.7.6', '>=0.4.24<0.8.0', '>=0.6.0<0.8.0', '>=0.6.2<0.8.0', '^0.7.0', '^0.7.6']
	- [0.7.6](../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L3)
	- [0.7.6](../../../../tokens/contracts/HasContractURI.sol#L3)
	- [0.7.6](../../../../tokens/contracts/IsPrivateCollection.sol#L3)
	- [0.7.6](../../../../tokens/contracts/LibURI.sol#L3)
	- [0.7.6](../../../../tokens/contracts/Mint721Validator.sol#L3)
	- [0.7.6](../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L3)
	- [0.7.6](../../../../tokens/contracts/erc-721-minimal/ERC721BaseMinimal.sol#L3)
	- [0.7.6](../../../../tokens/contracts/erc-721-minimal/ERC721DefaultApprovalMinimal.sol#L3)
	- [0.7.6](../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L3)
	- [0.7.6](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L3)
	- [0.7.6](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L3)
	- [>=0.4.24<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/proxy/Initializable.sol#L4)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/IERC165Upgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../tokens/contracts/access/MinterAccessControl.sol#L3)
	- [>=0.6.0<0.8.0](../../../../tokens/contracts/erc-721-minimal/ERC721BurnableUpgradeableMinimal.sol#L3)
	- [>=0.6.0<0.8.0](../../../../tokens/contracts/erc-721-minimal/ERC721URI.sol#L3)
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
	- [v2](../../../../tokens/contracts/erc-721-minimal/ERC721BaseMinimal.sol#L4)
	- [v2](../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L4)
	- [v2](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L4)

../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L3


## dead-code
Impact: Informational
Confidence: Medium
 - [ ] ID-33
[SafeMathUpgradeable.sub(uint256,uint256,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L170-L173) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L170-L173


 - [ ] ID-34
[ContextUpgradeable._msgData()](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L27-L30) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L27-L30


 - [ ] ID-35
[AddressUpgradeable.functionCallWithValue(address,bytes,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L104-L106) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L104-L106


 - [ ] ID-36
[SafeMathUpgradeable.trySub(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L35-L38) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L35-L38


 - [ ] ID-37
[ERC721UpgradeableMinimal._emitMintEvent(address,uint256)](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L310-L312) is never used and should be removed

../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L310-L312


 - [ ] ID-38
[HasContractURI._setContractURI(string)](../../../../tokens/contracts/HasContractURI.sol#L25-L27) is never used and should be removed

../../../../tokens/contracts/HasContractURI.sol#L25-L27


 - [ ] ID-39
[EIP712Upgradeable.__EIP712_init(string,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L44-L46) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L44-L46


 - [ ] ID-40
[AddressUpgradeable._verifyCallResult(bool,bytes,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L147-L164) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L147-L164


 - [ ] ID-41
[ERC721BurnableUpgradeableMinimal.__ERC721Burnable_init()](../../../../tokens/contracts/erc-721-minimal/ERC721BurnableUpgradeableMinimal.sol#L14-L18) is never used and should be removed

../../../../tokens/contracts/erc-721-minimal/ERC721BurnableUpgradeableMinimal.sol#L14-L18


 - [ ] ID-42
[SafeMathUpgradeable.div(uint256,uint256,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L190-L193) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L190-L193


 - [ ] ID-43
[AddressUpgradeable.functionCall(address,bytes)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L79-L81) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L79-L81


 - [ ] ID-44
[ERC721UpgradeableMinimal.__ERC721_init(string,string)](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L71-L75) is never used and should be removed

../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L71-L75


 - [ ] ID-45
[MinterAccessControl.__MinterAccessControl_init()](../../../../tokens/contracts/access/MinterAccessControl.sol#L12-L15) is never used and should be removed

../../../../tokens/contracts/access/MinterAccessControl.sol#L12-L15


 - [ ] ID-46
[AddressUpgradeable.functionCall(address,bytes,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L89-L91) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L89-L91


 - [ ] ID-47
[AddressUpgradeable.sendValue(address,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L53-L59) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L53-L59


 - [ ] ID-48
[SafeMathUpgradeable.tryMul(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L45-L53) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L45-L53


 - [ ] ID-49
[AddressUpgradeable.functionStaticCall(address,bytes)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L129-L131) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L129-L131


 - [ ] ID-50
[OwnableUpgradeable.__Ownable_init()](../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L27-L30) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L27-L30


 - [ ] ID-51
[SafeMathUpgradeable.mod(uint256,uint256,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L210-L213) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L210-L213


 - [ ] ID-52
[ERC165Upgradeable.__ERC165_init()](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L25-L27) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L25-L27


 - [ ] ID-53
[SafeMathUpgradeable.mul(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L116-L121) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L116-L121


 - [ ] ID-54
[SafeMathUpgradeable.div(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L135-L138) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L135-L138


 - [ ] ID-55
[SafeMathUpgradeable.tryAdd(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L24-L28) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L24-L28


 - [ ] ID-56
[ERC721UpgradeableMinimal._clearMetadata(uint256)](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L347-L348) is never used and should be removed

../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L347-L348


 - [ ] ID-57
[ERC1271.returnIsValidSignatureMagicNumber(bool)](../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L22-L24) is never used and should be removed

../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L22-L24


 - [ ] ID-58
[AddressUpgradeable.functionStaticCall(address,bytes,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L139-L145) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L139-L145


 - [ ] ID-59
[SafeMathUpgradeable.tryDiv(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L60-L63) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L60-L63


 - [ ] ID-60
[SafeMathUpgradeable.mod(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L152-L155) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L152-L155


 - [ ] ID-61
[SafeMathUpgradeable.tryMod(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L70-L73) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L70-L73


 - [ ] ID-62
[SafeMathUpgradeable.sub(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L101-L104) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L101-L104


 - [ ] ID-63
[ContextUpgradeable.__Context_init()](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L17-L19) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L17-L19


 - [ ] ID-64
[LibRoyalties2981.calculateRoyalties(address,uint256)](../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L15-L26) is never used and should be removed

../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L15-L26


 - [ ] ID-65
[AddressUpgradeable.functionCallWithValue(address,bytes,uint256,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L114-L121) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L114-L121


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-66
Pragma version[^0.7.6](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L2) allows old versions

../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L2


 - [ ] ID-67
Pragma version[0.7.6](../../../../tokens/contracts/erc-721-minimal/ERC721BaseMinimal.sol#L3) allows old versions

../../../../tokens/contracts/erc-721-minimal/ERC721BaseMinimal.sol#L3


 - [ ] ID-68
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L3) is too complex

../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L3


 - [ ] ID-69
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721MetadataUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721MetadataUpgradeable.sol#L3


 - [ ] ID-70
Pragma version[>=0.6.0<0.8.0](../../../../tokens/contracts/erc-721-minimal/ERC721URI.sol#L3) is too complex

../../../../tokens/contracts/erc-721-minimal/ERC721URI.sol#L3


 - [ ] ID-71
Pragma version[0.7.6](../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L3) allows old versions

../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L3


 - [ ] ID-72
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L3


 - [ ] ID-73
Pragma version[>=0.4.24<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/proxy/Initializable.sol#L4) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/proxy/Initializable.sol#L4


 - [ ] ID-74
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L3


 - [ ] ID-75
Pragma version[^0.7.6](../../../../tokens/contracts/operator-filter-registry/IOperatorFilterRegistry.sol#L2) allows old versions

../../../../tokens/contracts/operator-filter-registry/IOperatorFilterRegistry.sol#L2


 - [ ] ID-76
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L3


 - [ ] ID-77
Pragma version[0.7.6](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L3) allows old versions

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L3


 - [ ] ID-78
Pragma version[0.7.6](../../../../tokens/contracts/LibURI.sol#L3) allows old versions

../../../../tokens/contracts/LibURI.sol#L3


 - [ ] ID-79
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/IERC2981.sol#L3) is too complex

../../../../node_modules/@rarible/royalties/contracts/IERC2981.sol#L3


 - [ ] ID-80
Pragma version[0.7.6](../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L3) allows old versions

../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L3


 - [ ] ID-81
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/IERC165Upgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/IERC165Upgradeable.sol#L3


 - [ ] ID-82
Pragma version[>=0.6.0<0.8.0](../../../../tokens/contracts/access/MinterAccessControl.sol#L3) is too complex

../../../../tokens/contracts/access/MinterAccessControl.sol#L3


 - [ ] ID-83
Pragma version[^0.7.0](../../../../node_modules/@rarible/lib-signature/contracts/LibSignature.sol#L3) allows old versions

../../../../node_modules/@rarible/lib-signature/contracts/LibSignature.sol#L3


 - [ ] ID-84
Pragma version[0.7.6](../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L3) allows old versions

../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L3


 - [ ] ID-85
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/LibRoyaltiesV2.sol#L3) is too complex

../../../../node_modules/@rarible/royalties/contracts/LibRoyaltiesV2.sol#L3


 - [ ] ID-86
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/lazy-mint/contracts/erc-721/IERC721LazyMint.sol#L3) is too complex

../../../../node_modules/@rarible/lazy-mint/contracts/erc-721/IERC721LazyMint.sol#L3


 - [ ] ID-87
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol#L3


 - [ ] ID-88
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L3


 - [ ] ID-89
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol#L3


 - [ ] ID-90
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol#L3) is too complex

../../../../node_modules/@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol#L3


 - [ ] ID-91
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/lib-part/contracts/LibPart.sol#L3) is too complex

../../../../node_modules/@rarible/lib-part/contracts/LibPart.sol#L3


 - [ ] ID-92
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol#L3


 - [ ] ID-93
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L3


 - [ ] ID-94
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties-upgradeable/contracts/RoyaltiesV2Upgradeable.sol#L3) is too complex

../../../../node_modules/@rarible/royalties-upgradeable/contracts/RoyaltiesV2Upgradeable.sol#L3


 - [ ] ID-95
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L3


 - [ ] ID-96
Pragma version[>=0.6.0<0.8.0](../../../../tokens/contracts/erc-721-minimal/ERC721BurnableUpgradeableMinimal.sol#L3) is too complex

../../../../tokens/contracts/erc-721-minimal/ERC721BurnableUpgradeableMinimal.sol#L3


 - [ ] ID-97
Pragma version[0.7.6](../../../../tokens/contracts/erc-721-minimal/ERC721DefaultApprovalMinimal.sol#L3) allows old versions

../../../../tokens/contracts/erc-721-minimal/ERC721DefaultApprovalMinimal.sol#L3


 - [ ] ID-98
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol#L3) is too complex

../../../../node_modules/@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol#L3


 - [ ] ID-99
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/impl/AbstractRoyalties.sol#L3) is too complex

../../../../node_modules/@rarible/royalties/contracts/impl/AbstractRoyalties.sol#L3


 - [ ] ID-100
solc-0.7.6 is not recommended for deployment

 - [ ] ID-101
Pragma version[0.7.6](../../../../tokens/contracts/HasContractURI.sol#L3) allows old versions

../../../../tokens/contracts/HasContractURI.sol#L3


 - [ ] ID-102
Pragma version[0.7.6](../../../../tokens/contracts/IsPrivateCollection.sol#L3) allows old versions

../../../../tokens/contracts/IsPrivateCollection.sol#L3


 - [ ] ID-103
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/RoyaltiesV2.sol#L3) is too complex

../../../../node_modules/@rarible/royalties/contracts/RoyaltiesV2.sol#L3


 - [ ] ID-104
Pragma version[0.7.6](../../../../tokens/contracts/Mint721Validator.sol#L3) allows old versions

../../../../tokens/contracts/Mint721Validator.sol#L3


 - [ ] ID-105
Pragma version[0.7.6](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L3) allows old versions

../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L3


## low-level-calls
Impact: Informational
Confidence: High
 - [ ] ID-106
Low level call in [AddressUpgradeable.functionStaticCall(address,bytes,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L139-L145):
	- [(success,returndata) = target.staticcall(data)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L143)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L139-L145


 - [ ] ID-107
Low level call in [AddressUpgradeable.functionCallWithValue(address,bytes,uint256,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L114-L121):
	- [(success,returndata) = target.call{value: value}(data)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L119)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L114-L121


 - [ ] ID-108
Low level call in [AddressUpgradeable.sendValue(address,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L53-L59):
	- [(success) = recipient.call{value: amount}()](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L57)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L53-L59


## naming-convention
Impact: Informational
Confidence: High
 - [ ] ID-109
Parameter [LibURI.checkPrefix(string,string)._tokenURI](../../../../tokens/contracts/LibURI.sol#L7) is not in mixedCase

../../../../tokens/contracts/LibURI.sol#L7


 - [ ] ID-110
Function [ERC721LazyMinimal.__ERC721Lazy_init_unchained()](../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L25-L27) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L25-L27


 - [ ] ID-111
Parameter [ERC721RaribleMinimal.__ERC721Rarible_init(string,string,string,string,address,address,address)._symbol](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L21) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L21


 - [ ] ID-112
Function [ERC721RaribleMinimal.__ERC721RaribleUser_init(string,string,string,string,address[],address,address,address)](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L14-L19) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L14-L19


 - [ ] ID-113
Function [RoyaltiesV2Upgradeable.__RoyaltiesV2Upgradeable_init_unchained()](../../../../node_modules/@rarible/royalties-upgradeable/contracts/RoyaltiesV2Upgradeable.sol#L11-L13) is not in mixedCase

../../../../node_modules/@rarible/royalties-upgradeable/contracts/RoyaltiesV2Upgradeable.sol#L11-L13


 - [ ] ID-114
Variable [HasContractURI.__gap](../../../../tokens/contracts/HasContractURI.sol#L29) is not in mixedCase

../../../../tokens/contracts/HasContractURI.sol#L29


 - [ ] ID-115
Parameter [HasContractURI.__HasContractURI_init_unchained(string)._contractURI](../../../../tokens/contracts/HasContractURI.sol#L16) is not in mixedCase

../../../../tokens/contracts/HasContractURI.sol#L16


 - [ ] ID-116
Function [ERC721BurnableUpgradeableMinimal.__ERC721Burnable_init()](../../../../tokens/contracts/erc-721-minimal/ERC721BurnableUpgradeableMinimal.sol#L14-L18) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721BurnableUpgradeableMinimal.sol#L14-L18


 - [ ] ID-117
Variable [EIP712Upgradeable.__gap](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L120) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L120


 - [ ] ID-118
Parameter [RoyaltiesV2Impl.royaltyInfo(uint256,uint256)._salePrice](../../../../node_modules/@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol#L25) is not in mixedCase

../../../../node_modules/@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol#L25


 - [ ] ID-119
Function [Mint721Validator.__Mint721Validator_init_unchained()](../../../../tokens/contracts/Mint721Validator.sol#L9-L11) is not in mixedCase

../../../../tokens/contracts/Mint721Validator.sol#L9-L11


 - [ ] ID-120
Variable [ERC1271Validator.__gap](../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L34) is not in mixedCase

../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L34


 - [ ] ID-121
Variable [EIP712Upgradeable._HASHED_NAME](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L27) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L27


 - [ ] ID-122
Variable [ERC721LazyMinimal.__gap](../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L114) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L114


 - [ ] ID-123
Function [EIP712Upgradeable.__EIP712_init(string,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L44-L46) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L44-L46


 - [ ] ID-124
Variable [ContextUpgradeable.__gap](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L31) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L31


 - [ ] ID-125
Parameter [ERC721LazyMinimal.updateAccount(uint256,address,address)._to](../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L97) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L97


 - [ ] ID-126
Parameter [ERC721RaribleMinimal.__ERC721RaribleUser_init(string,string,string,string,address[],address,address,address)._name](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L14) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L14


 - [ ] ID-127
Parameter [ERC721LazyMinimal.updateAccount(uint256,address,address)._id](../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L97) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L97


 - [ ] ID-128
Parameter [ERC721RaribleMinimal.__ERC721RaribleUser_init(string,string,string,string,address[],address,address,address)._symbol](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L14) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L14


 - [ ] ID-129
Variable [ERC721URI.__gap](../../../../tokens/contracts/erc-721-minimal/ERC721URI.sol#L92) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721URI.sol#L92


 - [ ] ID-130
Function [OwnableUpgradeable.__Ownable_init()](../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L27-L30) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L27-L30


 - [ ] ID-131
Function [ERC721UpgradeableMinimal.__ERC721_init_unchained(string,string)](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L77-L84) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L77-L84


 - [ ] ID-132
Function [OperatorFiltererUpgradeable.__OperatorFilterer_init_unchained(address)](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L33-L40) is not in mixedCase

../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L33-L40


 - [ ] ID-133
Function [ERC721RaribleMinimal.__ERC721Rarible_init_unchained(string,string,string,string,address,address,address)](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L28-L45) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L28-L45


 - [ ] ID-134
Parameter [ERC721RaribleMinimal.__ERC721Rarible_init_unchained(string,string,string,string,address,address,address)._name](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L28) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L28


 - [ ] ID-135
Function [ERC721BurnableUpgradeableMinimal.__ERC721Burnable_init_unchained()](../../../../tokens/contracts/erc-721-minimal/ERC721BurnableUpgradeableMinimal.sol#L20-L21) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721BurnableUpgradeableMinimal.sol#L20-L21


 - [ ] ID-136
Variable [OwnableUpgradeable.__gap](../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L74) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L74


 - [ ] ID-137
Parameter [MinterAccessControl.removeMinter(address)._minter](../../../../tokens/contracts/access/MinterAccessControl.sol#L42) is not in mixedCase

../../../../tokens/contracts/access/MinterAccessControl.sol#L42


 - [ ] ID-138
Function [MinterAccessControl.__MinterAccessControl_init_unchained()](../../../../tokens/contracts/access/MinterAccessControl.sol#L17-L18) is not in mixedCase

../../../../tokens/contracts/access/MinterAccessControl.sol#L17-L18


 - [ ] ID-139
Function [ERC721RaribleMinimal.__ERC721Rarible_init(string,string,string,string,address,address,address)](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L21-L26) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L21-L26


 - [ ] ID-140
Variable [ERC721UpgradeableMinimal.__gap](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L443) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L443


 - [ ] ID-141
Parameter [ERC721LazyMinimal.updateAccount(uint256,address,address)._from](../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L97) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L97


 - [ ] ID-142
Function [ERC721UpgradeableMinimal.__ERC721_init(string,string)](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L71-L75) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L71-L75


 - [ ] ID-143
Function [ERC165Upgradeable.__ERC165_init_unchained()](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L29-L33) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L29-L33


 - [ ] ID-144
Function [ContextUpgradeable.__Context_init_unchained()](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L21-L22) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L21-L22


 - [ ] ID-145
Function [EIP712Upgradeable._EIP712VersionHash()](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L117-L119) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L117-L119


 - [ ] ID-146
Parameter [ERC721LazyMinimal.getCreators(uint256)._id](../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L102) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721LazyMinimal.sol#L102


 - [ ] ID-147
Variable [EIP712Upgradeable._HASHED_VERSION](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L28) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L28


 - [ ] ID-148
Variable [MinterAccessControl.__gap](../../../../tokens/contracts/access/MinterAccessControl.sol#L54) is not in mixedCase

../../../../tokens/contracts/access/MinterAccessControl.sol#L54


 - [ ] ID-149
Function [HasContractURI.__HasContractURI_init_unchained(string)](../../../../tokens/contracts/HasContractURI.sol#L16-L19) is not in mixedCase

../../../../tokens/contracts/HasContractURI.sol#L16-L19


 - [ ] ID-150
Function [MinterAccessControl.__MinterAccessControl_init()](../../../../tokens/contracts/access/MinterAccessControl.sol#L12-L15) is not in mixedCase

../../../../tokens/contracts/access/MinterAccessControl.sol#L12-L15


 - [ ] ID-151
Function [EIP712Upgradeable._EIP712NameHash()](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L107-L109) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L107-L109


 - [ ] ID-152
Function [OperatorFiltererUpgradeable.OPERATOR_FILTER_REGISTRY()](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L28-L30) is not in mixedCase

../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L28-L30


 - [ ] ID-153
Variable [ERC721BurnableUpgradeableMinimal.__gap](../../../../tokens/contracts/erc-721-minimal/ERC721BurnableUpgradeableMinimal.sol#L41) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721BurnableUpgradeableMinimal.sol#L41


 - [ ] ID-154
Variable [ERC165Upgradeable.__gap](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L59) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L59


 - [ ] ID-155
Function [OwnableUpgradeable.__Ownable_init_unchained()](../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L32-L36) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L32-L36


 - [ ] ID-156
Parameter [ERC721UpgradeableMinimal.safeTransferFrom(address,address,uint256,bytes)._data](../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L196) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721UpgradeableMinimal.sol#L196


 - [ ] ID-157
Variable [IsPrivateCollection.__gap](../../../../tokens/contracts/IsPrivateCollection.sol#L9) is not in mixedCase

../../../../tokens/contracts/IsPrivateCollection.sol#L9


 - [ ] ID-158
Parameter [ERC721RaribleMinimal.__ERC721Rarible_init(string,string,string,string,address,address,address)._name](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L21) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L21


 - [ ] ID-159
Variable [ERC721BaseMinimal.__gap](../../../../tokens/contracts/erc-721-minimal/ERC721BaseMinimal.sol#L91) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721BaseMinimal.sol#L91


 - [ ] ID-160
Function [ContextUpgradeable.__Context_init()](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L17-L19) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L17-L19


 - [ ] ID-161
Variable [ERC721DefaultApprovalMinimal.__gap](../../../../tokens/contracts/erc-721-minimal/ERC721DefaultApprovalMinimal.sol#L24) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721DefaultApprovalMinimal.sol#L24


 - [ ] ID-162
Function [ERC165Upgradeable.__ERC165_init()](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L25-L27) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L25-L27


 - [ ] ID-163
Variable [Mint721Validator.__gap](../../../../tokens/contracts/Mint721Validator.sol#L16) is not in mixedCase

../../../../tokens/contracts/Mint721Validator.sol#L16


 - [ ] ID-164
Parameter [ERC721RaribleMinimal.__ERC721Rarible_init_unchained(string,string,string,string,address,address,address)._symbol](../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L28) is not in mixedCase

../../../../tokens/contracts/erc-721-minimal/ERC721RaribleMinimal.sol#L28


 - [ ] ID-165
Function [EIP712Upgradeable.__EIP712_init_unchained(string,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L48-L53) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L48-L53


## redundant-statements
Impact: Informational
Confidence: High
 - [ ] ID-166
Redundant expression "[this](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L94)" in[EIP712Upgradeable](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L25-L121)

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L94


 - [ ] ID-167
Redundant expression "[this](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L28)" in[ContextUpgradeable](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L16-L32)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L28


## too-many-digits
Impact: Informational
Confidence: Medium
 - [ ] ID-168
[LibRoyalties2981.slitherConstructorConstantVariables()](../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L7-L27) uses literals with too many digits:
	- [_WEIGHT_VALUE = 1000000](../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L12)

../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L7-L27


 - [ ] ID-169
[ERC1271.slitherConstructorConstantVariables()](../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L5-L26) uses literals with too many digits:
	- [ERC1271_RETURN_INVALID_SIGNATURE = 0x00000000](../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L9)

../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L5-L26


## unimplemented-functions
Impact: Informational
Confidence: High
 - [ ] ID-170
[ERC1271](../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L5-L26) does not implement functions:
	- [ERC1271.isValidSignature(bytes32,bytes)](../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L20)

../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L5-L26


## unused-state
Impact: Informational
Confidence: High
 - [ ] ID-171
[LibRoyalties2981._INTERFACE_ID_ROYALTIES](../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L11) is never used in [LibRoyalties2981](../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L7-L27)

../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L11


 - [ ] ID-172
[LibERC721LazyMint._INTERFACE_ID_MINT_AND_TRANSFER](../../../../node_modules/@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol#L9) is never used in [LibERC721LazyMint](../../../../node_modules/@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol#L7-L39)

../../../../node_modules/@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol#L9


