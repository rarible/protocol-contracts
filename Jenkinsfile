pipeline {
  agent any

	options {
		disableConcurrentBuilds()
	}
    
  stages {
    stage('test') {
      steps {
        sh 'cd exchange-v2; npm i; truffle test --compile-all'
      }
    }
    stage('Verify') {
        agent {
            docker { image 'baseverify:latest' }
        }
        steps {
            sh 'yarn install'
            sh 'yarn bootstrap'
            sh 'cd deploy'
            sh 'verify-all.bash'
        }
    }
  }
}
