import { providers, Signer } from "ethers";
import { ExchangeV2, ExchangeV2__factory } from "@rarible/exchange-v2/typechain-types";

export async function getProtocolFee(exchangeV2Address: string, signerOrProvider: Signer | providers.Provider) {
    const exchangeV2: ExchangeV2 = ExchangeV2__factory.connect(exchangeV2Address, signerOrProvider);
    const fee = await exchangeV2.protocolFee();
    return {
        receiver: fee.receiver,
        buyerAmount: fee.buyerAmount.toString(),
        sellerAmount: fee.sellerAmount.toString(),
    };
}