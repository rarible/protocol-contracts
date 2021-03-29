pipeline {
  agent any

  stages {
    stage('test') {
      steps {
        sh 'cd exchange-v2; npm i; truffle test --compile-all'
      }
    }
  }
}
