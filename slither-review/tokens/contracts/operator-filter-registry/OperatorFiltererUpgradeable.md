**THIS CHECKLIST IS NOT COMPLETE**. Use `--show-ignored-findings` to show all the results.
Summary
 - [assembly](#assembly) (2 results) (Informational)
 - [pragma](#pragma) (1 results) (Informational)
 - [dead-code](#dead-code) (12 results) (Informational)
 - [solc-version](#solc-version) (5 results) (Informational)
 - [low-level-calls](#low-level-calls) (3 results) (Informational)
 - [naming-convention](#naming-convention) (2 results) (Informational)
## assembly
Impact: Informational
Confidence: High
 - [ ] ID-0
[AddressUpgradeable.isContract(address)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L26-L35) uses assembly
	- [INLINE ASM](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L33)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L26-L35


 - [ ] ID-1
[AddressUpgradeable._verifyCallResult(bool,bytes,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L147-L164) uses assembly
	- [INLINE ASM](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L156-L159)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L147-L164


## pragma
Impact: Informational
Confidence: High
 - [ ] ID-2
Different versions of Solidity are used:
	- Version used: ['>=0.4.24<0.8.0', '>=0.6.2<0.8.0', '^0.7.6']
	- [>=0.4.24<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/proxy/Initializable.sol#L4)
	- [>=0.6.2<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L3)
	- [^0.7.6](../../../../tokens/contracts/operator-filter-registry/IOperatorFilterRegistry.sol#L2)
	- [^0.7.6](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L2)

../../../../node_modules/@openzeppelin/contracts-upgradeable/proxy/Initializable.sol#L4


## dead-code
Impact: Informational
Confidence: Medium
 - [ ] ID-3
[AddressUpgradeable.functionCallWithValue(address,bytes,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L104-L106) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L104-L106


 - [ ] ID-4
[AddressUpgradeable._verifyCallResult(bool,bytes,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L147-L164) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L147-L164


 - [ ] ID-5
[AddressUpgradeable.functionCall(address,bytes)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L79-L81) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L79-L81


 - [ ] ID-6
[AddressUpgradeable.isContract(address)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L26-L35) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L26-L35


 - [ ] ID-7
[OperatorFiltererUpgradeable.__OperatorFilterer_init_unchained(address)](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L33-L40) is never used and should be removed

../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L33-L40


 - [ ] ID-8
[AddressUpgradeable.functionCall(address,bytes,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L89-L91) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L89-L91


 - [ ] ID-9
[AddressUpgradeable.sendValue(address,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L53-L59) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L53-L59


 - [ ] ID-10
[AddressUpgradeable.functionStaticCall(address,bytes)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L129-L131) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L129-L131


 - [ ] ID-11
[OperatorFiltererUpgradeable._checkFilterOperator(address)](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L66-L73) is never used and should be removed

../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L66-L73


 - [ ] ID-12
[Initializable._isConstructor()](../../../../node_modules/@openzeppelin/contracts-upgradeable/proxy/Initializable.sol#L52-L54) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/proxy/Initializable.sol#L52-L54


 - [ ] ID-13
[AddressUpgradeable.functionStaticCall(address,bytes,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L139-L145) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L139-L145


 - [ ] ID-14
[AddressUpgradeable.functionCallWithValue(address,bytes,uint256,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L114-L121) is never used and should be removed

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L114-L121


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-15
Pragma version[^0.7.6](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L2) allows old versions

../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L2


 - [ ] ID-16
Pragma version[>=0.4.24<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/proxy/Initializable.sol#L4) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/proxy/Initializable.sol#L4


 - [ ] ID-17
Pragma version[^0.7.6](../../../../tokens/contracts/operator-filter-registry/IOperatorFilterRegistry.sol#L2) allows old versions

../../../../tokens/contracts/operator-filter-registry/IOperatorFilterRegistry.sol#L2


 - [ ] ID-18
Pragma version[>=0.6.2<0.8.0](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L3) is too complex

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L3


 - [ ] ID-19
solc-0.7.6 is not recommended for deployment

## low-level-calls
Impact: Informational
Confidence: High
 - [ ] ID-20
Low level call in [AddressUpgradeable.functionStaticCall(address,bytes,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L139-L145):
	- [(success,returndata) = target.staticcall(data)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L143)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L139-L145


 - [ ] ID-21
Low level call in [AddressUpgradeable.functionCallWithValue(address,bytes,uint256,string)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L114-L121):
	- [(success,returndata) = target.call{value: value}(data)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L119)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L114-L121


 - [ ] ID-22
Low level call in [AddressUpgradeable.sendValue(address,uint256)](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L53-L59):
	- [(success) = recipient.call{value: amount}()](../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L57)

../../../../node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#L53-L59


## naming-convention
Impact: Informational
Confidence: High
 - [ ] ID-23
Function [OperatorFiltererUpgradeable.__OperatorFilterer_init_unchained(address)](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L33-L40) is not in mixedCase

../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L33-L40


 - [ ] ID-24
Function [OperatorFiltererUpgradeable.OPERATOR_FILTER_REGISTRY()](../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L28-L30) is not in mixedCase

../../../../tokens/contracts/operator-filter-registry/OperatorFiltererUpgradeable.sol#L28-L30


