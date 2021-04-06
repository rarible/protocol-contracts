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
  }
}
