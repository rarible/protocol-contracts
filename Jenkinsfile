pipeline {
  agent any

  stages {
    stage('test') {
      steps {
        cd 'exchange-v2'
        npm i
        truffle test --compile-all
      }
    }
  }
}
