@Library('shared-library') _  

properties(
  [
    parameters([
      choice(name: "NETWORK", choices: ["chiliz-testnet", "mantle-testnet", "astarzkevm-testnet"])
    ])   
  ]
)

def pipelineConfig = [
  "JSpublicLibrary": "true",
  "pkgRepoName": "npmjs-org",
  "buildWith": "nodetruffle",
  "baseImageTag": "18.19.0"
]

configFileProvider([configFile(fileId: "protocol-contracts-network-settings", variable: 'NETWORK_SETTINGS')]) {
  pipelinePackageRelease(pipelineConfig)
}