pipeline {
    agent {
        label 'frontend-node'
    }
    
    environment {
        NVM_DIR = "${env.HOME}/.nvm"
        PATH = "${env.NVM_DIR}/versions/node/v22.0.0/bin:${env.PATH}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                git 'https://github.com/nipunapamuditha/newsx-frontend.git'
            }
        }
        
        stage('Setup Node.js') {
            steps {
                sh '''
                export NVM_DIR="$HOME/.nvm"
                [ -s "$NVM_DIR/nvm.sh" ] || curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
                . "$NVM_DIR/nvm.sh"
                nvm install 22
                nvm alias default 22
                nvm use default
                node -v
                npm -v
                '''
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh '''
                export NVM_DIR="$HOME/.nvm"
                . "$NVM_DIR/nvm.sh"
                nvm use default
                npm install
                '''
            }
        }
        
        stage('Build') {
            steps {
                sh '''
                export NVM_DIR="$HOME/.nvm"
                . "$NVM_DIR/nvm.sh"
                nvm use default
                npm run build
                '''
            }
        }
        
        stage('Test') {
            steps {
                sh '''
                export NVM_DIR="$HOME/.nvm"
                . "$NVM_DIR/nvm.sh"
                nvm use default
                npm test
                '''
            }
        }
        
        stage('Deploy') {
            steps {
                sshagent(['0ff14880-bcc6-4400-a835-a66a5a3cf0ba']) {
                    sh '''
                    export NVM_DIR="$HOME/.nvm"
                    . "$NVM_DIR/nvm.sh"
                    nvm use default
                    scp -r build/* jenkins@10.10.10.81:/home/jenkins/frontend
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed.'
        }
    }
}