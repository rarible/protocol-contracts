pipeline {
  agent any

  stages {
    stage('test') {
      steps {
        sh 'cd exchange-v2'
        sh 'npm i'
        sh 'truffle test --compile-all'
      }
    }
  }
}
