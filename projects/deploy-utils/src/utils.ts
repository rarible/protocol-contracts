import type {
  HttpNetworkUserConfig,
} from "hardhat/types";
import * as dotenv from "dotenv";
import * as os from "os";
import * as path from "path";
import fs from "fs";

dotenv.config();

export function getConfigPath() {
  const configPath = process.env["NETWORK_CONFIG_PATH"];
  if (configPath) {
    return configPath;
  } else {
    return path.join(os.homedir(), ".ethereum");
  }
}

export function getNetworkApiKey(name: string): string {
  const configPath = path.join(getConfigPath(), name + ".json");
  if (fs.existsSync(configPath)) {
    var json = require(configPath);
    if (!!json.verify) {
      return json.verify.apiKey;
    }
    else {
      return "xyz"
    }
  } else {
    // File doesn't exist in path
    return "xyz";
  }
}

export function getNetworkApiUrl(name: string): string {
  let result:string = "";
  const configPath = path.join(getConfigPath(), name + ".json");
  if (fs.existsSync(configPath)) {
    var json = require(configPath);
    if (json.verify && json.verify.apiUrl) {
      result = json.verify.apiUrl;
    }
  }
  return result;
}

export function getNetworkExplorerUrl(name: string): string {
  let result:string = "";
  const configPath = path.join(getConfigPath(), name + ".json");
  if (fs.existsSync(configPath)) {
    var json = require(configPath);
    if (json.verify && json.verify.explorerUrl) {
      result = json.verify.explorerUrl;
    }
  }
  return result;
}

export function createNetwork(name: string): HttpNetworkUserConfig {
  const configPath = path.join(getConfigPath(), name + ".json");
  if (fs.existsSync(configPath)) {
    var json = require(configPath);
    if (json.verify && json.verify.apiUrl && json.verify.apiUrl.endsWith("/api")) {
      json.verify.apiUrl = json.verify.apiUrl.slice(0, -4);
    }
    //if frame
    if (!json.key) {
      return {
        url: json.url || "",
        chainId: parseInt(json.network_id),
        timeout: 60000,
      }
    } else {
      // if not frame
      return {
        from: json.address,
        gasPrice: json.gasPrice || "auto",
        chainId: parseInt(json.network_id),
        url: json.url || "",
        accounts: [json.key],
        gas: json.gas || 5000000,
        saveDeployments: true,
        timeout: json.timeout || 60000,
        verify: json.verify
          ? {
              etherscan: {
                apiKey: "xyz",
                apiUrl: json.verify.apiUrl,
              },
            }
          : null,
        zksync: json.zksync === true,
      } as HttpNetworkUserConfig;
    }
  } else {
    // File doesn't exist in path
    return {
      from: "0x0000000000000000000000000000000000000000",
      gas: 0,
      chainId: 0,
      url: "",
      accounts: [],
      gasPrice: 0,
    };
  }
}

export function loadNetworkConfigs(): Record<string, HttpNetworkUserConfig | {}> {
    let configs: Record<string, HttpNetworkUserConfig | {}> = {
        hardhat: {}
    };

    // Ensure the directory exists
    const directory = getConfigPath(); // Make sure this function is defined and returns the path to the config directory
    if (!fs.existsSync(directory)) {
        console.error(`Directory ${directory} does not exist.`);
        return configs; // Return default with only Hardhat network if no directory
    }

    // Read all files from the config directory
    const files = fs.readdirSync(directory);

    // Filter JSON files
    const jsonFiles = files.filter(file => path.extname(file) === '.json');

    // Process each JSON file
    jsonFiles.forEach(file => {
        const networkName = path.basename(file, '.json');
        // Create network configurations dynamically
        configs[networkName] = createNetwork(networkName);
    });

    return configs;
}


// Function to read and parse the network configuration JSON file
function readNetworkConfig(file: string): { chainId: number, apiUrl: string, explorerUrl: string } | null {
    const filePath = path.join(getConfigPath(), file);
    if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, 'utf8');
        try {
            const json = JSON.parse(fileData);
            // Validate or extract only the needed properties with correct types
            if (json && typeof json.chainId === 'number' && typeof json.apiUrl === 'string' && typeof json.explorerUrl === 'string') {
                return {
                    chainId: json.chainId,
                    apiUrl: json.apiUrl,
                    explorerUrl: json.explorerUrl
                };
            }
        } catch (err) {
            console.error(`Error parsing JSON from file ${filePath}: ${err}`);
        }
    } else {
        console.warn(`Configuration file not found: ${filePath}`);
    }
    return null;
}

// Main function to load and return custom network configurations
export function loadCustomNetworks(): Array<{ network: string; chainId: number; urls: { apiURL: string; browserURL: string; } }> {
    const configDirectory = getConfigPath();
    let networks = new Array<string>();
    if (fs.existsSync(configDirectory)) {
      const files = fs.readdirSync(configDirectory).filter(file => path.extname(file) === '.json');
      networks = files.map(file => path.basename(file, '.json'));
    }

    return networks.map(network => {
        const configData = readNetworkConfig(network + '.json');
        if (!configData) return null;

        return {
            network,
            chainId: configData.chainId,
            urls: {
                apiURL: configData.apiUrl,
                browserURL: configData.explorerUrl
            }
        };
    }).filter(network => network !== null) as Array<{ network: string; chainId: number; urls: { apiURL: string; browserURL: string; } }>;
}

// Function to convert snake_case or other formats to camelCase
function toCamelCase(str: string): string {
    return str.replace(/([-_]\w)/g, (g) => g[1].toUpperCase());
}

// Function to read and parse the network configuration JSON file for API keys
function readApiKeyFromConfig(file: string): string {
    const filePath = path.join(getConfigPath(), file);
    try {
        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(fileData);
            return jsonData.verify && jsonData.verify.apiKey ? jsonData.verify.apiKey : "Key not found";
        } else {
            console.warn(`Configuration file not found: ${filePath}`);
            return "Key not found";
        }
    } catch (error) {
        console.error(`Error reading or parsing the file ${filePath}: ${error}`);
        return "Key not found";
    }
}

// Main function to load API keys from configuration files
export function loadApiKeys(): Record<string, string> {
    const configDirectory = getConfigPath();
    const apiKeys: Record<string, string> = {};
    if (fs.existsSync(configDirectory)) {
      // Read all JSON files from the config directory
      const files = fs.readdirSync(configDirectory).filter(file => path.extname(file) === '.json');

      // Process each JSON file and extract API keys
      files.forEach(file => {
          const networkName = path.basename(file, '.json'); // Removes the .json extension to get the network name
          const camelCaseKey = toCamelCase(networkName);   // Convert network name to camelCase for the key
          apiKeys[camelCaseKey] = readApiKeyFromConfig(file); // Read the API key from the file
      });
    }

    return apiKeys;
}

// Function to read and extract factory addresses from JSON files, keeping the specific structure
export function loadFactoryAddresses(): Record<string, { factory: string }> {
    const configDirectory = getConfigPath();
    const factoryAddresses: Record<string, { factory: string }> = {};
  
    if (fs.existsSync(configDirectory)) {
      const files = fs.readdirSync(configDirectory).filter(file => path.extname(file) === '.json');
      
      files.forEach(file => {
        const filePath = path.join(configDirectory, file);
        const data = fs.readFileSync(filePath, 'utf8');
        try {
          const json = JSON.parse(data);
          const chainId = json.network_id as string; // assuming 'network_id' is the key for network identifier
          const factory = json.factory as string; // assuming 'factory' is the key where the factory address is stored
  
          if (chainId && factory) {
            factoryAddresses[chainId] = { factory };
          }
        } catch (error) {
          console.error(`Error parsing JSON in ${file}: ${error}`);
        }
      });
    } else {
      console.error(`Configuration directory not found: ${configDirectory}`);
    }
  
    return factoryAddresses;
  }
  