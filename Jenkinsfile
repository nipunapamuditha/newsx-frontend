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
                // Use bash explicitly to set Node.js version with nvm
                sh '''
                export NVM_DIR="$HOME/.nvm"
                if [ ! -s "$NVM_DIR/nvm.sh" ]; then
                    echo "Installing nvm..."
                    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
                fi
                bash -c "source $NVM_DIR/nvm.sh && \
                echo Installing Node.js 14... && \
                nvm install 14 && \
                nvm use 14 && \
                echo Using Node.js version: && \
                node -v"
                '''
            }
        }
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        stage('Deploy') {
            steps {
                sshagent(['0ff14880-bcc6-4400-a835-a66a5a3cf0ba']) {
                    sh 'scp -r build/* jenkins@10.10.10.81:/home/jenkins/frontend'
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