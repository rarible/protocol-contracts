@Library('shared-library') _  

def pipelineConfig = [
  "JSpublicLibrary": "true",
  "pkgRepoName": "npmjs-org",
  "buildWith": "nodetruffle",
  "baseImageTag": "18.19.0"
]

configFileProvider([configFile(fileId: "${NETWORK}", variable: 'NETWORK_SETTINGS')]) {
  pipelinePackageRelease(pipelineConfig)
}