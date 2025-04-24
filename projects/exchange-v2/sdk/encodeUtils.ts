import { ethers } from "ethers";

/**
 * Encodes V3 data for zero payouts/originFees
 */
export function encodeV3Data(
  payouts: { account: string; value: number | string }[] = [],
  originFees: { account: string; value: number | string }[] = [],
  isMakeFill: boolean = false
): string {
    return ethers.utils.defaultAbiCoder.encode(
      [
        "tuple((address account, uint96 value)[] payouts, (address account, uint96 value)[] originFees, bool isMakeFill)"
      ],
      [
        [
          payouts, // payouts
          originFees, // originFees
          isMakeFill // isMakeFill
        ]
      ]
    );
}

/**
 * Encodes ERC20 token address for the asset data
 */
export function encodeERC20AssetData(erc20Address: string): string {
    return ethers.utils.defaultAbiCoder.encode(["address"], [erc20Address]);
}