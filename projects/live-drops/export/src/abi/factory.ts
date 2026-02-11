export const liveDropFactoryAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "feeRecipient_",
        "type": "address"
      },
      {
        "internalType": "uint16",
        "name": "defaultFeeBps_",
        "type": "uint16"
      },
      {
        "internalType": "uint256",
        "name": "defaultFeeFixedNative_",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "defaultFeeFixedErc20_",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "defaultErc20_",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "InvalidErc20Token",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint16",
        "name": "bps",
        "type": "uint16"
      }
    ],
    "name": "InvalidFeeBps",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidFeeRecipient",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAddress",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "collection",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      }
    ],
    "name": "CollectionCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "erc20Token",
        "type": "address"
      }
    ],
    "name": "DefaultErc20Updated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "feeBps",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "feeFixedNative",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "feeFixedErc20",
        "type": "uint256"
      }
    ],
    "name": "DefaultFeesUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "feeRecipient",
        "type": "address"
      }
    ],
    "name": "FeeRecipientUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "allCollections",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "symbol",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "icon",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "tokenMetaName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "tokenMetaDescription",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "tokenMetaImage",
            "type": "string"
          }
        ],
        "internalType": "struct LiveDropFactory.CollectionConfig",
        "name": "config",
        "type": "tuple"
      }
    ],
    "name": "createCollection",
    "outputs": [
      {
        "internalType": "address",
        "name": "collection",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "defaultErc20",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "defaultFeeBps",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "defaultFeeFixedErc20",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "defaultFeeFixedNative",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "feeRecipient",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCollectionCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getCollections",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "collections",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDefaults",
    "outputs": [
      {
        "internalType": "address",
        "name": "_feeRecipient",
        "type": "address"
      },
      {
        "internalType": "uint16",
        "name": "_feeBps",
        "type": "uint16"
      },
      {
        "internalType": "uint256",
        "name": "_feeFixedNative",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_feeFixedErc20",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_erc20",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isCollection",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "erc20_",
        "type": "address"
      }
    ],
    "name": "setDefaultErc20",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint16",
        "name": "feeBps_",
        "type": "uint16"
      },
      {
        "internalType": "uint256",
        "name": "feeFixedNative_",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "feeFixedErc20_",
        "type": "uint256"
      }
    ],
    "name": "setDefaultFees",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "feeRecipient_",
        "type": "address"
      }
    ],
    "name": "setFeeRecipient",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
