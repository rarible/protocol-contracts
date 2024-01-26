@Library('shared-library') _

parameters {
  choice(name: "network", choices: ["chiliz-testnet", "mantle-testnet", "astarzkevm-testnet"])
}

def pipelineConfig = [
  "JSpublicLibrary": "true",
  "pkgRepoName": "npmjs-org",
  "buildWith": "nodetruffle",
  "baseImageTag": "18.19.0"
]

configFileProvider([configFile(fileId: "${network}", variable: 'NETWORK_SETTINGS')]) {
  pipelinePackageRelease(pipelineConfig)
}