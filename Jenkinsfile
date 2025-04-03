pipeline {
    agent {
        label 'frontend-node'
    }
    stages {
        stage('Checkout') {
            steps {
                git 'https://github.com/nipunapamuditha/newsx-frontend.git'
            }
        }
        stage('Set Node.js Version') {
            steps {
                // Install and use Node.js 14 with nvm
                sh '''
                export NVM_DIR="$HOME/.nvm"
                if [ ! -s "$NVM_DIR/nvm.sh" ]; then
                    echo "Installing nvm..."
                    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
                fi
                source "$NVM_DIR/nvm.sh"
                echo "Installing Node.js 14..."
                nvm install 14
                nvm alias default 14
                nvm use 14
                echo "Using Node.js version:"
                node -v
                '''
            }
        }
        stage('Install Dependencies') {
            steps {
                // Use Node.js 14 to install dependencies
                sh '''
                export NVM_DIR="$HOME/.nvm"
                source "$NVM_DIR/nvm.sh"
                nvm use 14
                npm install
                '''
            }
        }
        stage('Build') {
            steps {
                // Use Node.js 14 to build the project
                sh '''
                export NVM_DIR="$HOME/.nvm"
                source "$NVM_DIR/nvm.sh"
                nvm use 14
                npm run build
                '''
            }
        }
        stage('Test') {
            steps {
                // Use Node.js 14 to run tests
                sh '''
                export NVM_DIR="$HOME/.nvm"
                source "$NVM_DIR/nvm.sh"
                nvm use 14
                npm test
                '''
            }
        }
        stage('Deploy') {
            steps {
                sshagent(['0ff14880-bcc6-4400-a835-a66a5a3cf0ba']) {
                    sh '''
                    export NVM_DIR="$HOME/.nvm"
                    source "$NVM_DIR/nvm.sh"
                    nvm use 14
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