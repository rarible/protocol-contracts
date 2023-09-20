**THIS CHECKLIST IS NOT COMPLETE**. Use `--show-ignored-findings` to show all the results.
Summary
 - [shadowing-state](#shadowing-state) (3 results) (High)
 - [reentrancy-no-eth](#reentrancy-no-eth) (1 results) (Medium)
 - [uninitialized-local](#uninitialized-local) (6 results) (Medium)
 - [unused-return](#unused-return) (2 results) (Medium)
 - [shadowing-local](#shadowing-local) (9 results) (Low)
 - [reentrancy-benign](#reentrancy-benign) (3 results) (Low)
 - [reentrancy-events](#reentrancy-events) (5 results) (Low)
 - [assembly](#assembly) (4 results) (Informational)
 - [pragma](#pragma) (1 results) (Informational)
 - [dead-code](#dead-code) (34 results) (Informational)
 - [solc-version](#solc-version) (41 results) (Informational)
 - [low-level-calls](#low-level-calls) (3 results) (Informational)
 - [naming-convention](#naming-convention) (69 results) (Informational)
 - [redundant-statements](#redundant-statements) (2 results) (Informational)
 - [too-many-digits](#too-many-digits) (2 results) (Informational)
 - [unimplemented-functions](#unimplemented-functions) (2 results) (Informational)
 - [unused-state](#unused-state) (3 results) (Informational)
## shadowing-state
Impact: High
Confidence: High
 - [ ] ID-0
[ERC1155Lazy._INTERFACE_ID_ERC1155_METADATA_URI](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L18) shadows:
	- [ERC1155Upgradeable._INTERFACE_ID_ERC1155_METADATA_URI](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L51)

../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L18


 - [ ] ID-1
[ERC1155Lazy._INTERFACE_ID_ERC165](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L16) shadows:
	- [ERC165Upgradeable._INTERFACE_ID_ERC165](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L18)

../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L16


 - [ ] ID-2
[ERC1155Lazy._INTERFACE_ID_ERC1155](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L17) shadows:
	- [ERC1155Upgradeable._INTERFACE_ID_ERC1155](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L46)

../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L17


## reentrancy-no-eth
Impact: Medium
Confidence: Medium
 - [ ] ID-3
Reentrancy in [ERC1155Lazy.transferFromOrMint(LibERC1155LazyMint.Mint1155Data,address,address,uint256)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L37-L57):
	External calls:
	- [safeTransferFrom(from,to,data.tokenId,transfer,)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L50)
		- [IERC1155ReceiverUpgradeable(to).onERC1155Received(operator,from,id,amount,data)](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L380-L388)
	- [mintAndTransfer(data,to,left)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L55)
		- [IERC1155ReceiverUpgradeable(to).onERC1155Received(operator,from,id,amount,data)](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L380-L388)
	State variables written after the call(s):
	- [mintAndTransfer(data,to,left)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L55)
		- [_balances[id][account] = _balances[id][account].add(amount)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L105)
	[ERC1155Upgradeable._balances](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L27) can be used in cross function reentrancies:
	- [ERC1155Lazy._mint(address,uint256,uint256,bytes)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L94-L108)
	- [ERC1155Upgradeable.balanceOf(address,uint256)](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L93-L96)
	- [ERC1155Upgradeable.safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L178-L214)
	- [ERC1155Upgradeable.safeTransferFrom(address,address,uint256,uint256,bytes)](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L146-L173)

../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L37-L57


## uninitialized-local
Impact: Medium
Confidence: Medium
 - [ ] ID-4
[ERC1155Upgradeable._doSafeTransferAcceptanceCheck(address,address,address,uint256,uint256,bytes).response](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L380) is a local variable never initialized

../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L380


 - [ ] ID-5
[LibRoyalties2981.calculateRoyalties(address,uint256).result](../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L16) is a local variable never initialized

../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L16


 - [ ] ID-6
[ERC1155Upgradeable._doSafeBatchTransferAcceptanceCheck(address,address,address,uint256[],uint256[],bytes).reason](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L407) is a local variable never initialized

../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L407


 - [ ] ID-7
[ERC1271Validator.validate1271(address,bytes32,bytes).signerFromSig](../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L19) is a local variable never initialized

../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L19


 - [ ] ID-8
[ERC1155Upgradeable._doSafeTransferAcceptanceCheck(address,address,address,uint256,uint256,bytes).reason](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L384) is a local variable never initialized

../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L384


 - [ ] ID-9
[ERC1155Upgradeable._doSafeBatchTransferAcceptanceCheck(address,address,address,uint256[],uint256[],bytes).response](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L403) is a local variable never initialized

../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L403


## unused-return
Impact: Medium
Confidence: Medium
 - [ ] ID-10
[ERC1155Upgradeable._doSafeBatchTransferAcceptanceCheck(address,address,address,uint256[],uint256[],bytes)](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L392-L413) ignores return value by [IERC1155ReceiverUpgradeable(to).onERC1155BatchReceived(operator,from,ids,amounts,data)](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L403-L411)

../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L392-L413


 - [ ] ID-11
[ERC1155Upgradeable._doSafeTransferAcceptanceCheck(address,address,address,uint256,uint256,bytes)](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L369-L390) ignores return value by [IERC1155ReceiverUpgradeable(to).onERC1155Received(operator,from,id,amount,data)](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L380-L388)

../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L369-L390


## shadowing-local
Impact: Low
Confidence: High
 - [ ] ID-12
[ERC1155Base.isApprovedForAll(address,address)._owner](../../../../tokens/contracts/erc-1155/ERC1155Base.sol#L22) shadows:
	- [OwnableUpgradeable._owner](../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L20) (state variable)

../../../../tokens/contracts/erc-1155/ERC1155Base.sol#L22


 - [ ] ID-13
[ERC1155Rarible.__ERC1155RaribleUser_init(string,string,string,string,address[],address,address,address).contractURI](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L14) shadows:
	- [HasContractURI.contractURI](../../../../tokens/contracts/HasContractURI.sol#L9) (state variable)

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L14


 - [ ] ID-14
[ERC1155Rarible.__ERC1155RaribleUser_init(string,string,string,string,address[],address,address,address).baseURI](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L14) shadows:
	- [ERC1155BaseURI.baseURI()](../../../../tokens/contracts/erc-1155/ERC1155BaseURI.sol#L24-L26) (function)

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L14


 - [ ] ID-15
[ERC1155Rarible.__ERC1155Rarible_init(string,string,string,string,address,address,address).contractURI](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L21) shadows:
	- [HasContractURI.contractURI](../../../../tokens/contracts/HasContractURI.sol#L9) (state variable)

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L21


 - [ ] ID-16
[ERC1155Rarible.__ERC1155Rarible_init_unchained(string,string,string,string,address,address,address).contractURI](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L28) shadows:
	- [HasContractURI.contractURI](../../../../tokens/contracts/HasContractURI.sol#L9) (state variable)

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L28


 - [ ] ID-17
[ERC1155Base._burnLazy(uint256,uint256).supply](../../../../tokens/contracts/erc-1155/ERC1155Base.sol#L59) shadows:
	- [ERC1155Lazy.supply](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L21) (state variable)

../../../../tokens/contracts/erc-1155/ERC1155Base.sol#L59


 - [ ] ID-18
[ERC1155Rarible.__ERC1155Rarible_init_unchained(string,string,string,string,address,address,address).baseURI](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L28) shadows:
	- [ERC1155BaseURI.baseURI()](../../../../tokens/contracts/erc-1155/ERC1155BaseURI.sol#L24-L26) (function)

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L28


 - [ ] ID-19
[ERC1155BaseURI._setTokenURI(uint256,string)._uri](../../../../tokens/contracts/erc-1155/ERC1155BaseURI.sol#L55) shadows:
	- [ERC1155Upgradeable._uri](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L33) (state variable)

../../../../tokens/contracts/erc-1155/ERC1155BaseURI.sol#L55


 - [ ] ID-20
[ERC1155Rarible.__ERC1155Rarible_init(string,string,string,string,address,address,address).baseURI](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L21) shadows:
	- [ERC1155BaseURI.baseURI()](../../../../tokens/contracts/erc-1155/ERC1155BaseURI.sol#L24-L26) (function)

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L21


## reentrancy-benign
Impact: Low
Confidence: Medium
 - [ ] ID-21
Reentrancy in [ERC1155Rarible.__ERC1155Rarible_init_unchained(string,string,string,string,address,address,address)](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L28-L46):
	External calls:
	- [__OperatorFilterer_init_unchained(subscribeTo)](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L41)
		- [IOperatorFilterRegistry(OPERATOR_FILTER_REGISTRY()).registerAndSubscribe(address(this),subscribeTo)](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L38)
	State variables written after the call(s):
	- [_setDefaultApproval(transferProxy,true)](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L44)
		- [defaultApprovals[operator] = hasApproval](../../../../tokens/contracts/erc-1155/ERC1155DefaultApproval.sol#L13)
	- [_setDefaultApproval(lazyTransferProxy,true)](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L45)
		- [defaultApprovals[operator] = hasApproval](../../../../tokens/contracts/erc-1155/ERC1155DefaultApproval.sol#L13)

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L28-L46


 - [ ] ID-22
Reentrancy in [ERC1155Rarible.__ERC1155Rarible_init(string,string,string,string,address,address,address)](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L21-L26):
	External calls:
	- [__ERC1155Rarible_init_unchained(_name,_symbol,baseURI,contractURI,transferProxy,lazyTransferProxy,subscribeTo)](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L22)
		- [IOperatorFilterRegistry(OPERATOR_FILTER_REGISTRY()).registerAndSubscribe(address(this),subscribeTo)](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L38)
	State variables written after the call(s):
	- [isPrivate = false](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L24)

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L21-L26


 - [ ] ID-23
Reentrancy in [ERC1155Rarible.__ERC1155RaribleUser_init(string,string,string,string,address[],address,address,address)](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L14-L19):
	External calls:
	- [__ERC1155Rarible_init_unchained(_name,_symbol,baseURI,contractURI,transferProxy,lazyTransferProxy,subscribeTo)](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L15)
		- [IOperatorFilterRegistry(OPERATOR_FILTER_REGISTRY()).registerAndSubscribe(address(this),subscribeTo)](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L38)
	State variables written after the call(s):
	- [isPrivate = true](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L17)

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L14-L19


## reentrancy-events
Impact: Low
Confidence: Medium
 - [ ] ID-24
Reentrancy in [ERC1155Lazy.transferFromOrMint(LibERC1155LazyMint.Mint1155Data,address,address,uint256)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L37-L57):
	External calls:
	- [safeTransferFrom(from,to,data.tokenId,transfer,)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L50)
		- [IERC1155ReceiverUpgradeable(to).onERC1155Received(operator,from,id,amount,data)](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L380-L388)
	- [mintAndTransfer(data,to,left)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L55)
		- [IERC1155ReceiverUpgradeable(to).onERC1155Received(operator,from,id,amount,data)](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L380-L388)
	Event emitted after the call(s):
	- [Creators(tokenId,_creators)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L126)
		- [mintAndTransfer(data,to,left)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L55)
	- [RoyaltiesSet(id,_royalties)](../../../../node_modules/@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol#L18)
		- [mintAndTransfer(data,to,left)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L55)
	- [Supply(tokenId,_supply)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L113)
		- [mintAndTransfer(data,to,left)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L55)
	- [TransferSingle(sender,address(0),minter,data.tokenId,_amount)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L87)
		- [mintAndTransfer(data,to,left)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L55)
	- [TransferSingle(sender,minter,to,data.tokenId,_amount)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L88)
		- [mintAndTransfer(data,to,left)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L55)
	- [TransferSingle(sender,address(0),to,data.tokenId,_amount)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L90)
		- [mintAndTransfer(data,to,left)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L55)
	- [URI(_tokenURI(tokenId),tokenId)](../../../../tokens/contracts/erc-1155/ERC1155BaseURI.sol#L57)
		- [mintAndTransfer(data,to,left)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L55)

../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L37-L57


 - [ ] ID-25
Reentrancy in [ERC1155Lazy.mintAndTransfer(LibERC1155LazyMint.Mint1155Data,address,uint256)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L59-L92):
	External calls:
	- [_mint(to,data.tokenId,_amount,)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L85)
		- [IERC1155ReceiverUpgradeable(to).onERC1155Received(operator,from,id,amount,data)](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L380-L388)
	Event emitted after the call(s):
	- [TransferSingle(sender,address(0),minter,data.tokenId,_amount)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L87)
	- [TransferSingle(sender,minter,to,data.tokenId,_amount)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L88)
	- [TransferSingle(sender,address(0),to,data.tokenId,_amount)](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L90)

../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L59-L92


 - [ ] ID-26
Reentrancy in [ERC1155Rarible.__ERC1155Rarible_init(string,string,string,string,address,address,address)](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L21-L26):
	External calls:
	- [__ERC1155Rarible_init_unchained(_name,_symbol,baseURI,contractURI,transferProxy,lazyTransferProxy,subscribeTo)](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L22)
		- [IOperatorFilterRegistry(OPERATOR_FILTER_REGISTRY()).registerAndSubscribe(address(this),subscribeTo)](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L38)
	Event emitted after the call(s):
	- [CreateERC1155Rarible(_msgSender(),_name,_symbol)](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L25)

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L21-L26


 - [ ] ID-27
Reentrancy in [ERC1155Rarible.__ERC1155Rarible_init_unchained(string,string,string,string,address,address,address)](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L28-L46):
	External calls:
	- [__OperatorFilterer_init_unchained(subscribeTo)](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L41)
		- [IOperatorFilterRegistry(OPERATOR_FILTER_REGISTRY()).registerAndSubscribe(address(this),subscribeTo)](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L38)
	Event emitted after the call(s):
	- [DefaultApproval(operator,hasApproval)](../../../../tokens/contracts/erc-1155/ERC1155DefaultApproval.sol#L14)
		- [_setDefaultApproval(transferProxy,true)](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L44)
	- [DefaultApproval(operator,hasApproval)](../../../../tokens/contracts/erc-1155/ERC1155DefaultApproval.sol#L14)
		- [_setDefaultApproval(lazyTransferProxy,true)](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L45)

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L28-L46


 - [ ] ID-28
Reentrancy in [ERC1155Rarible.__ERC1155RaribleUser_init(string,string,string,string,address[],address,address,address)](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L14-L19):
	External calls:
	- [__ERC1155Rarible_init_unchained(_name,_symbol,baseURI,contractURI,transferProxy,lazyTransferProxy,subscribeTo)](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L15)
		- [IOperatorFilterRegistry(OPERATOR_FILTER_REGISTRY()).registerAndSubscribe(address(this),subscribeTo)](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L38)
	Event emitted after the call(s):
	- [CreateERC1155RaribleUser(_msgSender(),_name,_symbol)](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L18)

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L14-L19


## assembly
Impact: Informational
Confidence: High
 - [ ] ID-29
[EIP712Upgradeable._getChainId()](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L93-L99) uses assembly
	- [INLINE ASM](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L96-L98)

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L93-L99


 - [ ] ID-30
[AddressUpgradeable.isContract(address)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L26-L35) uses assembly
	- [INLINE ASM](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L33)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L26-L35


 - [ ] ID-31
[LibSignature.recover(bytes32,bytes)](../../../../node_modules/@rarible/lib-signature/contracts/LibSignature.sol#L20-L45) uses assembly
	- [INLINE ASM](../../../../node_modules/@rarible/lib-signature/contracts/LibSignature.sol#L38-L42)

../../../../node_modules/@rarible/lib-signature/contracts/LibSignature.sol#L20-L45


 - [ ] ID-32
[AddressUpgradeable._verifyCallResult(bool,bytes,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L147-L164) uses assembly
	- [INLINE ASM](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L156-L159)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L147-L164


## pragma
Impact: Informational
Confidence: High
 - [ ] ID-33
Different versions of Solidity are used:
	- Version used: ['0.7.6', '>=0.4.24<0.8.0', '>=0.6.0<0.8.0', '>=0.6.2<0.8.0', '^0.7.0', '^0.7.6']
	- [0.7.6](../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L3)
	- [0.7.6](../../../../tokens/contracts/HasContractURI.sol#L3)
	- [0.7.6](../../../../tokens/contracts/IsPrivateCollection.sol#L3)
	- [0.7.6](../../../../tokens/contracts/LibURI.sol#L3)
	- [0.7.6](../../../../tokens/contracts/erc-1155/ERC1155Base.sol#L3)
	- [0.7.6](../../../../tokens/contracts/erc-1155/ERC1155BaseURI.sol#L3)
	- [0.7.6](../../../../tokens/contracts/erc-1155/ERC1155DefaultApproval.sol#L3)
	- [0.7.6](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L3)
	- [0.7.6](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L3)
	- [0.7.6](../../../../tokens/contracts/erc-1155/Mint1155Validator.sol#L3)
	- [0.7.6](../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L3)
	- [>=0.4.24<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/proxy/Initializable.sol#L4)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/IERC165Upgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155ReceiverUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155ReceiverUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../tokens/contracts/access/MinterAccessControl.sol#L3)
	- [>=0.6.0<0.8.0](../../../../tokens/contracts/erc-1155/ERC1155BurnableUpgradeable.sol#L3)
	- [>=0.6.0<0.8.0](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L3)
	- [>=0.6.2<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155MetadataURIUpgradeable.sol#L3)
	- [>=0.6.2<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol#L3)
	- [>=0.6.2<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L3)
	- [>=0.6.2<0.8.0](../../../../node_modules/@rarible/lazy-mint/contracts/erc-1155/IERC1155LazyMint.sol#L3)
	- [>=0.6.2<0.8.0](../../../../node_modules/@rarible/lazy-mint/contracts/erc-1155/LibERC1155LazyMint.sol#L3)
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
	- [v2](../../../../node_modules/@rarible/lazy-mint/contracts/erc-1155/IERC1155LazyMint.sol#L4)
	- [v2](../../../../node_modules/@rarible/royalties-upgradeable/contracts/RoyaltiesV2Upgradeable.sol#L4)
	- [v2](../../../../node_modules/@rarible/royalties/contracts/RoyaltiesV2.sol#L4)
	- [v2](../../../../node_modules/@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol#L4)
	- [v2](../../../../tokens/contracts/erc-1155/ERC1155Base.sol#L4)
	- [v2](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L4)
	- [v2](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L4)

../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L3


## dead-code
Impact: Informational
Confidence: Medium
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
[HasContractURI._setContractURI(string)](../../../../tokens/contracts/HasContractURI.sol#L25-L27) is never used and should be removed

../../../../tokens/contracts/HasContractURI.sol#L25-L27


 - [ ] ID-38
[ERC1155ReceiverUpgradeable.__ERC1155Receiver_init()](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155ReceiverUpgradeable.sol#L13-L16) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155ReceiverUpgradeable.sol#L13-L16


 - [ ] ID-39
[EIP712Upgradeable.__EIP712_init(string,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L44-L46) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L44-L46


 - [ ] ID-40
[AddressUpgradeable._verifyCallResult(bool,bytes,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L147-L164) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L147-L164


 - [ ] ID-41
[SafeMathUpgradeable.div(uint256,uint256,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L190-L193) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L190-L193


 - [ ] ID-42
[ERC1155Upgradeable._mint(address,uint256,uint256,bytes)](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L250-L261) is never used and should be removed

../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L250-L261


 - [ ] ID-43
[AddressUpgradeable.functionCall(address,bytes)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L79-L81) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L79-L81


 - [ ] ID-44
[MinterAccessControl.__MinterAccessControl_init()](../../../../tokens/contracts/access/MinterAccessControl.sol#L12-L15) is never used and should be removed

../../../../tokens/contracts/access/MinterAccessControl.sol#L12-L15


 - [ ] ID-45
[AddressUpgradeable.functionCall(address,bytes,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L89-L91) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L89-L91


 - [ ] ID-46
[AddressUpgradeable.sendValue(address,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L53-L59) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L53-L59


 - [ ] ID-47
[ERC1155ReceiverUpgradeable.__ERC1155Receiver_init_unchained()](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155ReceiverUpgradeable.sol#L18-L23) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155ReceiverUpgradeable.sol#L18-L23


 - [ ] ID-48
[SafeMathUpgradeable.tryMul(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L45-L53) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L45-L53


 - [ ] ID-49
[AddressUpgradeable.functionStaticCall(address,bytes)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L129-L131) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L129-L131


 - [ ] ID-50
[ERC1155Upgradeable.__ERC1155_init(string)](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L56-L60) is never used and should be removed

../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L56-L60


 - [ ] ID-51
[OwnableUpgradeable.__Ownable_init()](../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L27-L30) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L27-L30


 - [ ] ID-52
[SafeMathUpgradeable.mod(uint256,uint256,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L210-L213) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L210-L213


 - [ ] ID-53
[ERC165Upgradeable.__ERC165_init()](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L25-L27) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L25-L27


 - [ ] ID-54
[ERC1155BurnableUpgradeable.__ERC1155Burnable_init()](../../../../tokens/contracts/erc-1155/ERC1155BurnableUpgradeable.sol#L15-L19) is never used and should be removed

../../../../tokens/contracts/erc-1155/ERC1155BurnableUpgradeable.sol#L15-L19


 - [ ] ID-55
[SafeMathUpgradeable.mul(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L116-L121) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L116-L121


 - [ ] ID-56
[SafeMathUpgradeable.div(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L135-L138) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L135-L138


 - [ ] ID-57
[ERC1155Upgradeable._mintBatch(address,uint256[],uint256[],bytes)](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L272-L287) is never used and should be removed

../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L272-L287


 - [ ] ID-58
[SafeMathUpgradeable.tryAdd(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L24-L28) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L24-L28


 - [ ] ID-59
[ERC1271.returnIsValidSignatureMagicNumber(bool)](../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L22-L24) is never used and should be removed

../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L22-L24


 - [ ] ID-60
[AddressUpgradeable.functionStaticCall(address,bytes,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L139-L145) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L139-L145


 - [ ] ID-61
[SafeMathUpgradeable.tryDiv(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L60-L63) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L60-L63


 - [ ] ID-62
[SafeMathUpgradeable.mod(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L152-L155) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L152-L155


 - [ ] ID-63
[SafeMathUpgradeable.tryMod(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L70-L73) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L70-L73


 - [ ] ID-64
[SafeMathUpgradeable.sub(uint256,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L101-L104) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L101-L104


 - [ ] ID-65
[ContextUpgradeable.__Context_init()](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L17-L19) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L17-L19


 - [ ] ID-66
[LibRoyalties2981.calculateRoyalties(address,uint256)](../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L15-L26) is never used and should be removed

../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L15-L26


 - [ ] ID-67
[AddressUpgradeable.functionCallWithValue(address,bytes,uint256,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L114-L121) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L114-L121


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-68
Pragma version[0.7.6](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L3) allows old versions

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L3


 - [ ] ID-69
Pragma version[0.7.6](../../../../tokens/contracts/erc-1155/Mint1155Validator.sol#L3) allows old versions

../../../../tokens/contracts/erc-1155/Mint1155Validator.sol#L3


 - [ ] ID-70
Pragma version[0.7.6](../../../../tokens/contracts/erc-1155/ERC1155DefaultApproval.sol#L3) allows old versions

../../../../tokens/contracts/erc-1155/ERC1155DefaultApproval.sol#L3


 - [ ] ID-71
Pragma version[>=0.6.0<0.8.0](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L3) is too complex

../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L3


 - [ ] ID-72
Pragma version[^0.7.6](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L2) allows old versions

../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L2


 - [ ] ID-73
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L3) is too complex

../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L3


 - [ ] ID-74
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol#L3


 - [ ] ID-75
Pragma version[>=0.4.24<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/proxy/Initializable.sol#L4) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/proxy/Initializable.sol#L4


 - [ ] ID-76
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L3


 - [ ] ID-77
Pragma version[0.7.6](../../../../tokens/contracts/erc-1155/ERC1155BaseURI.sol#L3) allows old versions

../../../../tokens/contracts/erc-1155/ERC1155BaseURI.sol#L3


 - [ ] ID-78
Pragma version[^0.7.6](../../../../tokens/contracts/operator-filter-registry/IOperatorFilterRegistry.sol#L2) allows old versions

../../../../tokens/contracts/operator-filter-registry/IOperatorFilterRegistry.sol#L2


 - [ ] ID-79
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L3


 - [ ] ID-80
Pragma version[0.7.6](../../../../tokens/contracts/LibURI.sol#L3) allows old versions

../../../../tokens/contracts/LibURI.sol#L3


 - [ ] ID-81
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/IERC2981.sol#L3) is too complex

../../../../node_modules/@rarible/royalties/contracts/IERC2981.sol#L3


 - [ ] ID-82
Pragma version[0.7.6](../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L3) allows old versions

../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L3


 - [ ] ID-83
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/IERC165Upgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/IERC165Upgradeable.sol#L3


 - [ ] ID-84
Pragma version[>=0.6.0<0.8.0](../../../../tokens/contracts/access/MinterAccessControl.sol#L3) is too complex

../../../../tokens/contracts/access/MinterAccessControl.sol#L3


 - [ ] ID-85
Pragma version[^0.7.0](../../../../node_modules/@rarible/lib-signature/contracts/LibSignature.sol#L3) allows old versions

../../../../node_modules/@rarible/lib-signature/contracts/LibSignature.sol#L3


 - [ ] ID-86
Pragma version[0.7.6](../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L3) allows old versions

../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L3


 - [ ] ID-87
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/LibRoyaltiesV2.sol#L3) is too complex

../../../../node_modules/@rarible/royalties/contracts/LibRoyaltiesV2.sol#L3


 - [ ] ID-88
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/lazy-mint/contracts/erc-1155/IERC1155LazyMint.sol#L3) is too complex

../../../../node_modules/@rarible/lazy-mint/contracts/erc-1155/IERC1155LazyMint.sol#L3


 - [ ] ID-89
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L3


 - [ ] ID-90
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol#L3


 - [ ] ID-91
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155MetadataURIUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155MetadataURIUpgradeable.sol#L3


 - [ ] ID-92
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol#L3) is too complex

../../../../node_modules/@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol#L3


 - [ ] ID-93
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/lib-part/contracts/LibPart.sol#L3) is too complex

../../../../node_modules/@rarible/lib-part/contracts/LibPart.sol#L3


 - [ ] ID-94
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L3


 - [ ] ID-95
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties-upgradeable/contracts/RoyaltiesV2Upgradeable.sol#L3) is too complex

../../../../node_modules/@rarible/royalties-upgradeable/contracts/RoyaltiesV2Upgradeable.sol#L3


 - [ ] ID-96
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L3


 - [ ] ID-97
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155ReceiverUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155ReceiverUpgradeable.sol#L3


 - [ ] ID-98
Pragma version[>=0.6.0<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155ReceiverUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155ReceiverUpgradeable.sol#L3


 - [ ] ID-99
Pragma version[>=0.6.0<0.8.0](../../../../tokens/contracts/erc-1155/ERC1155BurnableUpgradeable.sol#L3) is too complex

../../../../tokens/contracts/erc-1155/ERC1155BurnableUpgradeable.sol#L3


 - [ ] ID-100
Pragma version[0.7.6](../../../../tokens/contracts/erc-1155/ERC1155Base.sol#L3) allows old versions

../../../../tokens/contracts/erc-1155/ERC1155Base.sol#L3


 - [ ] ID-101
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/impl/AbstractRoyalties.sol#L3) is too complex

../../../../node_modules/@rarible/royalties/contracts/impl/AbstractRoyalties.sol#L3


 - [ ] ID-102
solc-0.7.6 is not recommended for deployment

 - [ ] ID-103
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol#L3


 - [ ] ID-104
Pragma version[0.7.6](../../../../tokens/contracts/HasContractURI.sol#L3) allows old versions

../../../../tokens/contracts/HasContractURI.sol#L3


 - [ ] ID-105
Pragma version[0.7.6](../../../../tokens/contracts/IsPrivateCollection.sol#L3) allows old versions

../../../../tokens/contracts/IsPrivateCollection.sol#L3


 - [ ] ID-106
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/royalties/contracts/RoyaltiesV2.sol#L3) is too complex

../../../../node_modules/@rarible/royalties/contracts/RoyaltiesV2.sol#L3


 - [ ] ID-107
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@rarible/lazy-mint/contracts/erc-1155/LibERC1155LazyMint.sol#L3) is too complex

../../../../node_modules/@rarible/lazy-mint/contracts/erc-1155/LibERC1155LazyMint.sol#L3


 - [ ] ID-108
Pragma version[0.7.6](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L3) allows old versions

../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L3


## low-level-calls
Impact: Informational
Confidence: High
 - [ ] ID-109
Low level call in [AddressUpgradeable.functionStaticCall(address,bytes,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L139-L145):
	- [(success,returndata) = target.staticcall(data)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L143)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L139-L145


 - [ ] ID-110
Low level call in [AddressUpgradeable.functionCallWithValue(address,bytes,uint256,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L114-L121):
	- [(success,returndata) = target.call{value: value}(data)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L119)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L114-L121


 - [ ] ID-111
Low level call in [AddressUpgradeable.sendValue(address,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L53-L59):
	- [(success) = recipient.call{value: amount}()](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L57)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L53-L59


## naming-convention
Impact: Informational
Confidence: High
 - [ ] ID-112
Parameter [LibURI.checkPrefix(string,string)._tokenURI](../../../../tokens/contracts/LibURI.sol#L7) is not in mixedCase

../../../../tokens/contracts/LibURI.sol#L7


 - [ ] ID-113
Function [ERC1155Upgradeable.__ERC1155_init_unchained(string)](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L62-L70) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L62-L70


 - [ ] ID-114
Function [RoyaltiesV2Upgradeable.__RoyaltiesV2Upgradeable_init_unchained()](../../../../node_modules/@rarible/royalties-upgradeable/contracts/RoyaltiesV2Upgradeable.sol#L11-L13) is not in mixedCase

../../../../node_modules/@rarible/royalties-upgradeable/contracts/RoyaltiesV2Upgradeable.sol#L11-L13


 - [ ] ID-115
Variable [HasContractURI.__gap](../../../../tokens/contracts/HasContractURI.sol#L29) is not in mixedCase

../../../../tokens/contracts/HasContractURI.sol#L29


 - [ ] ID-116
Function [ERC1155ReceiverUpgradeable.__ERC1155Receiver_init()](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155ReceiverUpgradeable.sol#L13-L16) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155ReceiverUpgradeable.sol#L13-L16


 - [ ] ID-117
Parameter [ERC1155Lazy.updateAccount(uint256,address,address)._from](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L129) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L129


 - [ ] ID-118
Function [ERC1155Base.__ERC1155Base_init_unchained(string,string)](../../../../tokens/contracts/erc-1155/ERC1155Base.sol#L76-L79) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Base.sol#L76-L79


 - [ ] ID-119
Parameter [HasContractURI.__HasContractURI_init_unchained(string)._contractURI](../../../../tokens/contracts/HasContractURI.sol#L16) is not in mixedCase

../../../../tokens/contracts/HasContractURI.sol#L16


 - [ ] ID-120
Function [ERC1155ReceiverUpgradeable.__ERC1155Receiver_init_unchained()](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155ReceiverUpgradeable.sol#L18-L23) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155ReceiverUpgradeable.sol#L18-L23


 - [ ] ID-121
Function [Mint1155Validator.__Mint1155Validator_init_unchained()](../../../../tokens/contracts/erc-1155/Mint1155Validator.sol#L9-L11) is not in mixedCase

../../../../tokens/contracts/erc-1155/Mint1155Validator.sol#L9-L11


 - [ ] ID-122
Variable [EIP712Upgradeable.__gap](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L120) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L120


 - [ ] ID-123
Parameter [RoyaltiesV2Impl.royaltyInfo(uint256,uint256)._salePrice](../../../../node_modules/@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol#L25) is not in mixedCase

../../../../node_modules/@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol#L25


 - [ ] ID-124
Variable [ERC1271Validator.__gap](../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L34) is not in mixedCase

../../../../tokens/contracts/erc-1271/ERC1271Validator.sol#L34


 - [ ] ID-125
Variable [EIP712Upgradeable._HASHED_NAME](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L27) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L27


 - [ ] ID-126
Function [ERC1155Rarible.__ERC1155Rarible_init(string,string,string,string,address,address,address)](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L21-L26) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L21-L26


 - [ ] ID-127
Function [EIP712Upgradeable.__EIP712_init(string,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L44-L46) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L44-L46


 - [ ] ID-128
Variable [ContextUpgradeable.__gap](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L31) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L31


 - [ ] ID-129
Variable [ERC1155BaseURI.__gap](../../../../tokens/contracts/erc-1155/ERC1155BaseURI.sol#L69) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155BaseURI.sol#L69


 - [ ] ID-130
Parameter [ERC1155Base.isApprovedForAll(address,address)._owner](../../../../tokens/contracts/erc-1155/ERC1155Base.sol#L22) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Base.sol#L22


 - [ ] ID-131
Variable [ERC1155ReceiverUpgradeable.__gap](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155ReceiverUpgradeable.sol#L24) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155ReceiverUpgradeable.sol#L24


 - [ ] ID-132
Function [ERC1155Rarible.__ERC1155Rarible_init_unchained(string,string,string,string,address,address,address)](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L28-L46) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L28-L46


 - [ ] ID-133
Parameter [ERC1155Rarible.__ERC1155Rarible_init_unchained(string,string,string,string,address,address,address)._name](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L28) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L28


 - [ ] ID-134
Variable [ERC1155Upgradeable._balances](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L27) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L27


 - [ ] ID-135
Parameter [ERC1155Rarible.mintAndTransfer(LibERC1155LazyMint.Mint1155Data,address,uint256)._amount](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L48) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L48


 - [ ] ID-136
Function [OwnableUpgradeable.__Ownable_init()](../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L27-L30) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L27-L30


 - [ ] ID-137
Function [OperatorFiltererUpgradeable.__OperatorFilterer_init_unchained(address)](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L33-L40) is not in mixedCase

../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L33-L40


 - [ ] ID-138
Variable [OwnableUpgradeable.__gap](../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L74) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L74


 - [ ] ID-139
Function [ERC1155Lazy.__ERC1155Lazy_init_unchained()](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L24-L26) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L24-L26


 - [ ] ID-140
Parameter [ERC1155Rarible.__ERC1155Rarible_init(string,string,string,string,address,address,address)._symbol](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L21) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L21


 - [ ] ID-141
Parameter [ERC1155DefaultApproval.isApprovedForAll(address,address)._operator](../../../../tokens/contracts/erc-1155/ERC1155DefaultApproval.sol#L17) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155DefaultApproval.sol#L17


 - [ ] ID-142
Parameter [ERC1155DefaultApproval.isApprovedForAll(address,address)._owner](../../../../tokens/contracts/erc-1155/ERC1155DefaultApproval.sol#L17) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155DefaultApproval.sol#L17


 - [ ] ID-143
Parameter [MinterAccessControl.removeMinter(address)._minter](../../../../tokens/contracts/access/MinterAccessControl.sol#L42) is not in mixedCase

../../../../tokens/contracts/access/MinterAccessControl.sol#L42


 - [ ] ID-144
Function [MinterAccessControl.__MinterAccessControl_init_unchained()](../../../../tokens/contracts/access/MinterAccessControl.sol#L17-L18) is not in mixedCase

../../../../tokens/contracts/access/MinterAccessControl.sol#L17-L18


 - [ ] ID-145
Variable [ERC1155Lazy.__gap](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L150) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L150


 - [ ] ID-146
Function [ERC165Upgradeable.__ERC165_init_unchained()](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L29-L33) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L29-L33


 - [ ] ID-147
Function [ContextUpgradeable.__Context_init_unchained()](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L21-L22) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L21-L22


 - [ ] ID-148
Parameter [ERC1155Base.isApprovedForAll(address,address)._operator](../../../../tokens/contracts/erc-1155/ERC1155Base.sol#L22) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Base.sol#L22


 - [ ] ID-149
Function [EIP712Upgradeable._EIP712VersionHash()](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L117-L119) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L117-L119


 - [ ] ID-150
Variable [EIP712Upgradeable._HASHED_VERSION](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L28) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L28


 - [ ] ID-151
Variable [ERC1155BurnableUpgradeable.__gap](../../../../tokens/contracts/erc-1155/ERC1155BurnableUpgradeable.sol#L41) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155BurnableUpgradeable.sol#L41


 - [ ] ID-152
Variable [ERC1155Upgradeable.__gap](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L421) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L421


 - [ ] ID-153
Variable [MinterAccessControl.__gap](../../../../tokens/contracts/access/MinterAccessControl.sol#L54) is not in mixedCase

../../../../tokens/contracts/access/MinterAccessControl.sol#L54


 - [ ] ID-154
Function [HasContractURI.__HasContractURI_init_unchained(string)](../../../../tokens/contracts/HasContractURI.sol#L16-L19) is not in mixedCase

../../../../tokens/contracts/HasContractURI.sol#L16-L19


 - [ ] ID-155
Function [MinterAccessControl.__MinterAccessControl_init()](../../../../tokens/contracts/access/MinterAccessControl.sol#L12-L15) is not in mixedCase

../../../../tokens/contracts/access/MinterAccessControl.sol#L12-L15


 - [ ] ID-156
Variable [ERC1155DefaultApproval.__gap](../../../../tokens/contracts/erc-1155/ERC1155DefaultApproval.sol#L20) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155DefaultApproval.sol#L20


 - [ ] ID-157
Parameter [ERC1155Rarible.__ERC1155Rarible_init(string,string,string,string,address,address,address)._name](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L21) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L21


 - [ ] ID-158
Variable [ERC1155Base.__gap](../../../../tokens/contracts/erc-1155/ERC1155Base.sol#L125) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Base.sol#L125


 - [ ] ID-159
Parameter [ERC1155Lazy.updateAccount(uint256,address,address)._to](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L129) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L129


 - [ ] ID-160
Function [EIP712Upgradeable._EIP712NameHash()](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L107-L109) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L107-L109


 - [ ] ID-161
Function [OperatorFiltererUpgradeable.OPERATOR_FILTER_REGISTRY()](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L28-L30) is not in mixedCase

../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L28-L30


 - [ ] ID-162
Function [ERC1155Upgradeable.__ERC1155_init(string)](../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L56-L60) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Upgradeable.sol#L56-L60


 - [ ] ID-163
Variable [ERC165Upgradeable.__gap](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L59) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L59


 - [ ] ID-164
Function [OwnableUpgradeable.__Ownable_init_unchained()](../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L32-L36) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#L32-L36


 - [ ] ID-165
Parameter [ERC1155Base.__ERC1155Base_init_unchained(string,string)._symbol](../../../../tokens/contracts/erc-1155/ERC1155Base.sol#L76) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Base.sol#L76


 - [ ] ID-166
Parameter [ERC1155Lazy.getCreators(uint256)._id](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L134) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L134


 - [ ] ID-167
Function [ERC1155BurnableUpgradeable.__ERC1155Burnable_init()](../../../../tokens/contracts/erc-1155/ERC1155BurnableUpgradeable.sol#L15-L19) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155BurnableUpgradeable.sol#L15-L19


 - [ ] ID-168
Variable [Mint1155Validator.__gap](../../../../tokens/contracts/erc-1155/Mint1155Validator.sol#L16) is not in mixedCase

../../../../tokens/contracts/erc-1155/Mint1155Validator.sol#L16


 - [ ] ID-169
Parameter [ERC1155Rarible.__ERC1155RaribleUser_init(string,string,string,string,address[],address,address,address)._name](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L14) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L14


 - [ ] ID-170
Variable [IsPrivateCollection.__gap](../../../../tokens/contracts/IsPrivateCollection.sol#L9) is not in mixedCase

../../../../tokens/contracts/IsPrivateCollection.sol#L9


 - [ ] ID-171
Parameter [ERC1155Base.__ERC1155Base_init_unchained(string,string)._name](../../../../tokens/contracts/erc-1155/ERC1155Base.sol#L76) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Base.sol#L76


 - [ ] ID-172
Parameter [ERC1155Lazy.mintAndTransfer(LibERC1155LazyMint.Mint1155Data,address,uint256)._amount](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L59) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L59


 - [ ] ID-173
Parameter [ERC1155Rarible.__ERC1155RaribleUser_init(string,string,string,string,address[],address,address,address)._symbol](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L14) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L14


 - [ ] ID-174
Function [ERC1155BurnableUpgradeable.__ERC1155Burnable_init_unchained()](../../../../tokens/contracts/erc-1155/ERC1155BurnableUpgradeable.sol#L21-L22) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155BurnableUpgradeable.sol#L21-L22


 - [ ] ID-175
Function [ERC1155Rarible.__ERC1155RaribleUser_init(string,string,string,string,address[],address,address,address)](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L14-L19) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L14-L19


 - [ ] ID-176
Parameter [ERC1155Rarible.__ERC1155Rarible_init_unchained(string,string,string,string,address,address,address)._symbol](../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L28) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Rarible.sol#L28


 - [ ] ID-177
Function [ContextUpgradeable.__Context_init()](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L17-L19) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L17-L19


 - [ ] ID-178
Function [ERC165Upgradeable.__ERC165_init()](../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L25-L27) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/introspection/ERC165Upgradeable.sol#L25-L27


 - [ ] ID-179
Function [EIP712Upgradeable.__EIP712_init_unchained(string,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L48-L53) is not in mixedCase

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L48-L53


 - [ ] ID-180
Parameter [ERC1155Lazy.updateAccount(uint256,address,address)._id](../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L129) is not in mixedCase

../../../../tokens/contracts/erc-1155/ERC1155Lazy.sol#L129


## redundant-statements
Impact: Informational
Confidence: High
 - [ ] ID-181
Redundant expression "[this](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L94)" in[EIP712Upgradeable](../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L25-L121)

../../../../node_modules/@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol#L94


 - [ ] ID-182
Redundant expression "[this](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L28)" in[ContextUpgradeable](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L16-L32)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#L28


## too-many-digits
Impact: Informational
Confidence: Medium
 - [ ] ID-183
[LibRoyalties2981.slitherConstructorConstantVariables()](../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L7-L27) uses literals with too many digits:
	- [_WEIGHT_VALUE = 1000000](../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L12)

../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L7-L27


 - [ ] ID-184
[ERC1271.slitherConstructorConstantVariables()](../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L5-L26) uses literals with too many digits:
	- [ERC1271_RETURN_INVALID_SIGNATURE = 0x00000000](../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L9)

../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L5-L26


## unimplemented-functions
Impact: Informational
Confidence: High
 - [ ] ID-185
[ERC1155ReceiverUpgradeable](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155ReceiverUpgradeable.sol#L12-L25) does not implement functions:
	- [IERC1155ReceiverUpgradeable.onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155ReceiverUpgradeable.sol#L48-L56)
	- [IERC1155ReceiverUpgradeable.onERC1155Received(address,address,uint256,uint256,bytes)](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155ReceiverUpgradeable.sol#L25-L33)

../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155ReceiverUpgradeable.sol#L12-L25


 - [ ] ID-186
[ERC1271](../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L5-L26) does not implement functions:
	- [ERC1271.isValidSignature(bytes32,bytes)](../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L20)

../../../../node_modules/@rarible/lib-signature/contracts/ERC1271.sol#L5-L26


## unused-state
Impact: Informational
Confidence: High
 - [ ] ID-187
[LibERC1155LazyMint._INTERFACE_ID_MINT_AND_TRANSFER](../../../../node_modules/@rarible/lazy-mint/contracts/erc-1155/LibERC1155LazyMint.sol#L9) is never used in [LibERC1155LazyMint](../../../../node_modules/@rarible/lazy-mint/contracts/erc-1155/LibERC1155LazyMint.sol#L7-L40)

../../../../node_modules/@rarible/lazy-mint/contracts/erc-1155/LibERC1155LazyMint.sol#L9


 - [ ] ID-188
[LibRoyalties2981._INTERFACE_ID_ROYALTIES](../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L11) is never used in [LibRoyalties2981](../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L7-L27)

../../../../node_modules/@rarible/royalties/contracts/LibRoyalties2981.sol#L11


 - [ ] ID-189
[ERC1155ReceiverUpgradeable.__gap](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155ReceiverUpgradeable.sol#L24) is never used in [ERC1155ReceiverUpgradeable](../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155ReceiverUpgradeable.sol#L12-L25)

../../../../node_modules/@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155ReceiverUpgradeable.sol#L24


