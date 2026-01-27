import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Deploys 5 ItemCollection contracts for pack items:
 * - Common
 * - Rare
 * - Epic
 * - Legendary
 * - UltraRare
 */
const ItemCollectionsModule = buildModule("ItemCollectionsModule", (m) => {
  const owner = m.getParameter("owner");

  // Base URIs for each collection (points to metadata JSON)
  const commonUri = m.getParameter("commonUri");
  const rareUri = m.getParameter("rareUri");
  const epicUri = m.getParameter("epicUri");
  const legendaryUri = m.getParameter("legendaryUri");
  const ultraRareUri = m.getParameter("ultraRareUri");

  // Deploy 5 collections
  const commonCollection = m.contract("ItemCollection", ["Common Pool Item", "COMMON", commonUri, owner], {
    id: "CommonCollection",
  });

  const rareCollection = m.contract("ItemCollection", ["Rare Pool Item", "RARE", rareUri, owner], {
    id: "RareCollection",
  });

  const epicCollection = m.contract("ItemCollection", ["Epic Pool Item", "EPIC", epicUri, owner], {
    id: "EpicCollection",
  });

  const legendaryCollection = m.contract("ItemCollection", ["Legendary Pool Item", "LEGEND", legendaryUri, owner], {
    id: "LegendaryCollection",
  });

  const ultraRareCollection = m.contract("ItemCollection", ["Ultra Rare Pool Item", "ULTRARARE", ultraRareUri, owner], {
    id: "UltraRareCollection",
  });

  return {
    commonCollection,
    rareCollection,
    epicCollection,
    legendaryCollection,
    ultraRareCollection,
  };
});

export default ItemCollectionsModule;
