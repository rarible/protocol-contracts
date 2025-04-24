export async function getTokenAddress(factory: any, salt: string) {
    const tx = await factory['createToken(string,string,string,string,uint256)'](`SanityMintable_${salt}`, `SMNTBL_${salt}`, 'ipfs:/', 'ipfs:/', salt);
    const receipt = await tx.wait();
    const event = receipt.events?.find((event: any) => event.event === 'Create721RaribleProxy' || event.event === 'Create1155RaribleProxy');
    return event?.args?.proxy;
  }