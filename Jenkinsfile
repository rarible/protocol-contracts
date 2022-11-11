pipeline {
  agent any

	options {
		disableConcurrentBuilds()
	}
    
  stages {
    stage('Test') {
      environment {
        NETWORK = "goerli"
      }
      steps {
        sh './patches/apply-patch.bash'
        sh 'yarn install'
        sh 'yarn bootsrap'
        sh 'cd exchange-v2; yarn test; cd ..;'
        sh 'cd deploy; yarn test; cd ..;'
        sh 'cd locking; yarn test; cd ..;'
      }
    }
    stage('Build') {
        environment {
          NETWORK = "goerli"
          NETWORK_CONFIG_PATH = "$HOME" 
        }
        agent {
            docker { image 'baseverify:latest' }
        }
        steps {
            sh './patches/apply-patch.bash'
            sh 'yarn install'
            sh 'yarn bootstrap'
            sh 'cd deploy'
            sh 'yarn build'
        }
    }
    stage('Deploy') {
        environment {
          NETWORK = "goerli"
          NETWORK_CONFIG_PATH = "$HOME" 
        }
        agent {
            docker { image 'baseverify:latest' }
        }
        steps {
            sh './patches/apply-patch.bash'
            sh 'yarn install'
            sh 'yarn bootstrap'
            sh 'cd deploy'
            sh 'yarn build'
            sh 'yarn test'
            sh 'yarn deploy'
        }
    }
    stage('Verify') {
        environment {
          ETHERSCAN_API_KEY = ""
				  POLYGONSCAN_API_KEY = ""
          NETWORK = "goerli"
          NETWORK_CONFIG_PATH = "$HOME" 
        }
        agent {
            docker { image 'baseverify:latest' }
        }
        steps {
            sh './patches/apply-patch.bash'
            sh 'yarn install'
            sh 'yarn bootstrap'
            sh 'cd deploy'
            sh 'yarn verify'
        }
    }
  }
}
