// Hardhat Ignition module for deploying RoyaltiesRegistry with OpenZeppelin TransparentUpgradeableProxy
// Learn more at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

const RoyaltiesRegistryModule = buildModule("RoyaltiesRegistryModule", (m) => {
    // Get the owner parameter (proxy admin owner)
    // Type annotation is required for address parameters
    // Default value allows reuse from previous deployment
    const owner = m.getParameter<string>("owner")

    // 1. Deploy the RoyaltiesRegistry implementation contract
    const royaltiesRegistryImpl = m.contract("RoyaltiesRegistry", [], {
        id: "RoyaltiesRegistryImplementation",
    })

    // 2. Encode the initialization call: __RoyaltiesRegistry_init()
    // This function takes no arguments and initializes ownership to msg.sender
    const initData = m.encodeFunctionCall(royaltiesRegistryImpl, "__RoyaltiesRegistry_init", [])

    // 3. Deploy TransparentUpgradeableProxy
    // Constructor: (address logic, address initialOwner, bytes memory data)
    // - logic: implementation address
    // - initialOwner: owner of the ProxyAdmin (deployed internally)
    // - data: encoded initialization call
    const proxy = m.contract(
        "TransparentUpgradeableProxy",
        [royaltiesRegistryImpl, owner, initData],
        {
            id: "RoyaltiesRegistryProxy",
        }
    )

    return {
        royaltiesRegistryImpl,
        proxy,
    }
})

export default RoyaltiesRegistryModule

