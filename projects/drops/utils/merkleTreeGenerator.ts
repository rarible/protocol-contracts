import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { ethers } from 'ethers';
import { MerkleTree } from 'merkletreejs';

export interface AllowlistEntry {
  address: string;
  maxClaimable: string;
  price: string;
  currency: string;
}

export interface AllowlistProofEntry extends AllowlistEntry {
  leaf: string;
  proof: string[];
}

/**
 * Hashes a single allowlist entry using the Solidity-compatible hash.
 */
export function hashLeaf(entry: AllowlistEntry): string {
  return ethers.utils.solidityKeccak256(
    ['address', 'uint256', 'uint256', 'address'],
    [entry.address, entry.maxClaimable, entry.price, entry.currency]
  );
}

/**
 * Loads a CSV allowlist file, builds the Merkle Tree, and returns the root and full proof list.
 * @param csvPath Path to the CSV file containing allowlist data
 */
export function generateMerkleTreeFromCSV(csvPath: string): {
  root: string;
  tree: MerkleTree;
  entries: AllowlistProofEntry[];
} {
  const csvData = fs.readFileSync(csvPath, 'utf-8');
  const records: AllowlistEntry[] = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
  });

  const leaves = records.map(hashLeaf);
  const tree = new MerkleTree(leaves, ethers.utils.keccak256, { sortPairs: true });
  const root = tree.getHexRoot();

  const proofs: AllowlistProofEntry[] = records.map((entry) => {
    const leaf = hashLeaf(entry);
    return {
      ...entry,
      leaf,
      proof: tree.getHexProof(leaf),
    };
  });

  fs.writeFileSync("allowlist.json", JSON.stringify({root, proofs}, null, 2));

  return {
    root,
    tree,
    entries: proofs,
  };
}
