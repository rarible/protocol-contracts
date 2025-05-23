export async function createTokenFromFactory(factory: any, name: string, symbol: string, baseUri: string, contractUri: string, salt: string) {
    const tx = await factory['createToken(string,string,string,string,uint256)'](`${name}`, `${symbol}`, `${baseUri}`, `${contractUri}`, salt);
    const receipt = await tx.wait();
    const event = receipt.events?.find((event: any) => event.event === 'Create721RaribleProxy' || event.event === 'Create1155RaribleProxy');
    return event?.args?.proxy;
  }