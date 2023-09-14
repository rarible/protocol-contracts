// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "../erc-1155/ERC1155Rarible.sol";
import "@openzeppelin/contracts/proxy/BeaconProxy.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev This contract is for creating proxy to access ERC1155Rarible token.
 *
 * The beacon should be initialized before call ERC1155RaribleFactoryC2 constructor.
 *
 */
contract ERC1155RaribleFactoryC2 is Ownable{
    address public immutable beacon;
    address immutable transferProxy;
    address immutable lazyTransferProxy;
    address public immutable operatorFilterRegistrySubscriptionAddress;

    event Create1155RaribleProxy(address proxy);
    event Create1155RaribleUserProxy(address proxy);

    constructor(address _beacon, address _transferProxy, address _lazyTransferProxy, address _operatorFilterRegistrySubscriptionAddress) {
        beacon = _beacon;
        transferProxy = _transferProxy;
        lazyTransferProxy = _lazyTransferProxy;
        operatorFilterRegistrySubscriptionAddress = _operatorFilterRegistrySubscriptionAddress;
    }

    function createToken(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, uint salt) external {        
        address beaconProxy = deployProxy(getData(_name, _symbol, baseURI, contractURI), salt);

        ERC1155Rarible token = ERC1155Rarible(beaconProxy);
        token.transferOwnership(_msgSender());
        emit Create1155RaribleProxy(beaconProxy);
    }
    
    function createToken(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators, uint salt) external {
        address beaconProxy = deployProxy(getData(_name, _symbol, baseURI, contractURI, operators), salt);

        ERC1155Rarible token = ERC1155Rarible(address(beaconProxy));
        token.transferOwnership(_msgSender());
        emit Create1155RaribleUserProxy(beaconProxy);
    }

    //deploying BeaconProxy contract with create2
    function deployProxy(bytes memory data, uint salt) internal returns(address proxy){
        bytes memory bytecode = getCreationBytecode(data);
        assembly {
            proxy := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
            if iszero(extcodesize(proxy)) {
                revert(0, 0)
            }
        }
    }

    //adding constructor arguments to BeaconProxy bytecode
    function getCreationBytecode(bytes memory _data) internal view returns (bytes memory) {
        return abi.encodePacked(type(BeaconProxy).creationCode, abi.encode(beacon, _data));
    }

    //returns address that contract with such arguments will be deployed on
    function getAddress(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, uint _salt)
        public
        view
        returns (address)
    {   
        bytes memory bytecode = getCreationBytecode(getData(_name, _symbol, baseURI, contractURI));

        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(bytecode))
        );

        return address(uint160(uint(hash)));
    }

    function getData(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI) view internal returns(bytes memory){
        return abi.encodeWithSelector(ERC1155Rarible(0).__ERC1155Rarible_init.selector, _name, _symbol, baseURI, contractURI, transferProxy, lazyTransferProxy, operatorFilterRegistrySubscriptionAddress);
    }

    //returns address that contract with such arguments will be deployed on
    function getAddress(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators, uint _salt)
        public
        view
        returns (address)
    {   
        bytes memory bytecode = getCreationBytecode(getData(_name, _symbol, baseURI, contractURI, operators));

        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(bytecode))
        );

        return address(uint160(uint(hash)));
    }

    function getData(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators) view internal returns(bytes memory){
        return abi.encodeWithSelector(ERC1155Rarible(0).__ERC1155RaribleUser_init.selector, _name, _symbol, baseURI, contractURI, operators, transferProxy, lazyTransferProxy, operatorFilterRegistrySubscriptionAddress);
    }

}
