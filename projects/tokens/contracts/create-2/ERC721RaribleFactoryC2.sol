// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "../erc-721-minimal/ERC721RaribleMinimal.sol";
import "@openzeppelin/contracts/proxy/BeaconProxy.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev This contract is for creating proxy to access ERC721Rarible token.
 *
 * The beacon should be initialized before call ERC721RaribleFactoryC2 constructor.
 *
 */
contract ERC721RaribleFactoryC2 is Ownable {
    address public beacon;
    address transferProxy;
    address lazyTransferProxy;

    event Create721RaribleProxy(address proxy);
    event Create721RaribleUserProxy(address proxy);

    constructor(address _beacon, address _transferProxy, address _lazyTransferProxy, address initialOwner) {
        beacon = _beacon;
        transferProxy = _transferProxy;
        lazyTransferProxy = _lazyTransferProxy;
        transferOwnership(initialOwner);
    }

    function createToken(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, uint salt, address initialOwner) external {
        address beaconProxy = deployProxy(getData(_name, _symbol, baseURI, contractURI, initialOwner), salt);
        emit Create721RaribleProxy(beaconProxy);
    }

    function createToken(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators, uint salt, address initialOwner) external {
        address beaconProxy = deployProxy(getData(_name, _symbol, baseURI, contractURI, operators, initialOwner), salt);
        emit Create721RaribleUserProxy(beaconProxy);
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
    function getAddress(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, uint _salt, address initialOwner)
        public
        view
        returns (address)
    {   
        bytes memory bytecode = getCreationBytecode(getData(_name, _symbol, baseURI, contractURI, initialOwner));

        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(bytecode))
        );

        return address(uint160(uint(hash)));
    }

    function getData(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address initialOwner) view internal returns(bytes memory){
        return abi.encodeWithSelector(ERC721RaribleMinimal(0).__ERC721Rarible_init.selector, _name, _symbol, baseURI, contractURI, transferProxy, lazyTransferProxy, initialOwner);
    }

    //returns address that private contract with such arguments will be deployed on
    function getAddress(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators, uint _salt, address initialOwner)
        public
        view
        returns (address)
    {   
        bytes memory bytecode = getCreationBytecode(getData(_name, _symbol, baseURI, contractURI, operators, initialOwner));

        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(bytecode))
        );

        return address(uint160(uint(hash)));
    }

    function getData(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators, address initialOwner) view internal returns(bytes memory){
        return abi.encodeWithSelector(ERC721RaribleMinimal(0).__ERC721RaribleUser_init.selector, _name, _symbol, baseURI, contractURI, operators, transferProxy, lazyTransferProxy, initialOwner);
    }
}
