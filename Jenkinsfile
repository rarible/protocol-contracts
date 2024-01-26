properties(
  [
    parameters([
      choice(name: "network", choices: ["chiliz-testnet", "mantle-testnet", "astarzkevm-testnet"])
    ])   
  ]
)

@Library('shared-library') _  

def pipelineConfig = [
  "JSpublicLibrary": "true",
  "pkgRepoName": "npmjs-org",
  "buildWith": "nodetruffle",
  "baseImageTag": "18.19.0"
]

configFileProvider([configFile(fileId: "${network}", variable: 'NETWORK_SETTINGS')]) {
  pipelinePackageRelease(pipelineConfig)
}