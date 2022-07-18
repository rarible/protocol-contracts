// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.9.0;
pragma abicoder v2;

import "../erc-721-minimal/ERC721RaribleMinimal.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
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

    constructor(address _beacon, address _transferProxy, address _lazyTransferProxy) {
        beacon = _beacon;
        transferProxy = _transferProxy;
        lazyTransferProxy = _lazyTransferProxy;
    }

    function createToken(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, uint salt) external {
        address beaconProxy = deployProxy(getDataPublic(_name, _symbol, baseURI, contractURI), salt);
        ERC721RaribleMinimal token = ERC721RaribleMinimal(address(beaconProxy));
        token.transferOwnership(_msgSender());
        emit Create721RaribleProxy(beaconProxy);
    }

    //for private tokens operators[] array is always empty
    function createToken(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory, uint salt) external {
        address beaconProxy = deployProxy(getDataPrivate(_name, _symbol, baseURI, contractURI), salt);
        ERC721RaribleMinimal token = ERC721RaribleMinimal(address(beaconProxy));
        token.transferOwnership(_msgSender());
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
    function getAddress(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, uint _salt)
        public
        view
        returns (address)
    {   
        bytes memory bytecode = getCreationBytecode(getDataPublic(_name, _symbol, baseURI, contractURI));

        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(bytecode))
        );

        return address(uint160(uint(hash)));
    }

    //returns address that private contract with such arguments will be deployed on
    function getAddress(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory, uint _salt)
        public
        view
        returns (address)
    {   
        bytes memory bytecode = getCreationBytecode(getDataPrivate(_name, _symbol, baseURI, contractURI));

        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(bytecode))
        );

        return address(uint160(uint(hash)));
    }

    function getDataPublic(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI) view internal returns(bytes memory){
        return abi.encodeWithSelector(ERC721RaribleMinimal(address(0)).__ERC721Rarible_init.selector, _name, _symbol, baseURI, contractURI, transferProxy, lazyTransferProxy);
    }

    function getDataPrivate(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI) view internal returns(bytes memory){
        return abi.encodeWithSelector(ERC721RaribleMinimal(address(0)).__ERC721RaribleUser_init.selector, _name, _symbol, baseURI, contractURI, transferProxy, lazyTransferProxy);
    }
}
