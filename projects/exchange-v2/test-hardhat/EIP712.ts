// EIP712.ts

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface DomainData {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  }
  
  export interface TypedData {
    types: Record<string, Array<{ name: string; type: string }>>;
    domain: DomainData;
    primaryType: string;
    message: Record<string, any>;
  }
  
  export interface SignResult {
    data: TypedData;
    sig: string;
    v: number;
    r: string;
    s: string;
  }
  
  const DOMAIN_TYPE = [
    { type: "string", name: "name" },
    { type: "string", name: "version" },
    { type: "uint256", name: "chainId" },
    { type: "address", name: "verifyingContract" },
  ];
  
  /**
   * Creates the typed data object that will be used for EIP-712 signing.
   */
  export function createTypeData(
    domainData: DomainData,
    primaryType: string,
    message: Record<string, any>,
    types: Record<string, Array<{ name: string; type: string }>>
  ): TypedData {
    return {
      types: {
        EIP712Domain: DOMAIN_TYPE,
        ...types,
      },
      domain: domainData,
      primaryType: primaryType,
      message: message,
    };
  }
  
  /**
   * Signs EIP-712 typed data, attempting eth_signTypedData_v3 first, falling back if needed.
   */
  export function signTypedData(
    web3: any,
    from: string,
    data: TypedData
  ): Promise<SignResult> {
    return new Promise<SignResult>((resolve, reject) => {
      function callback(err: any, result: any) {
        if (err) {
          return reject(err);
        }
        if (result.error) {
          return reject(result.error);
        }
  
        const sig: string = result.result;
        const sig0 = sig.substring(2);
        const r = "0x" + sig0.substring(0, 64);
        const s = "0x" + sig0.substring(64, 128);
        const v = parseInt(sig0.substring(128, 130), 16);
  
        resolve({
          data,
          sig,
          v,
          r,
          s,
        });
      }
  
      // Attempt to sign with eth_signTypedData_v3 (Metamask)
      if (web3.currentProvider.isMetaMask) {
        web3.currentProvider.sendAsync(
          {
            jsonrpc: "2.0",
            method: "eth_signTypedData_v3",
            params: [from, JSON.stringify(data)],
            id: new Date().getTime(),
          },
          callback
        );
      } else {
        let send = web3.currentProvider.sendAsync;
        if (!send) {
          send = web3.currentProvider.send;
        }
        send.bind(web3.currentProvider)(
          {
            jsonrpc: "2.0",
            method: "eth_signTypedData",
            params: [from, data],
            id: new Date().getTime(),
          },
          callback
        );
      }
    });
  }
  
  /**
   * Signs EIP-712 typed data using the 'v4' method if supported, or falls back to v3.
   */
  export function signTypedData_v4(
    web3: any,
    from: string,
    data: TypedData
  ): Promise<SignResult> {
    return new Promise<SignResult>((resolve, reject) => {
      function callback(err: any, result: any) {
        if (err) {
          return reject(err);
        }
        if (result.error) {
          return reject(result.error);
        }
  
        const sig: string = result.result;
        const sig0 = sig.substring(2);
        const r = "0x" + sig0.substring(0, 64);
        const s = "0x" + sig0.substring(64, 128);
        const v = parseInt(sig0.substring(128, 130), 16);
  
        resolve({
          data,
          sig,
          v,
          r,
          s,
        });
      }
  
      if (web3.currentProvider.isMetaMask) {
        // Metamask sometimes doesn't support eth_signTypedData_v4, so we fallback to v3 here
        web3.currentProvider.sendAsync(
          {
            jsonrpc: "2.0",
            method: "eth_signTypedData_v3",
            params: [from, JSON.stringify(data)],
            id: new Date().getTime(),
          },
          callback
        );
      } else {
        let send = web3.currentProvider.sendAsync;
        if (!send) {
          send = web3.currentProvider.send;
        }
        send.bind(web3.currentProvider)(
          {
            jsonrpc: "2.0",
            method: "eth_signTypedData_v4",
            params: [from, data],
            id: new Date().getTime(),
          },
          callback
        );
      }
    });
  }
  