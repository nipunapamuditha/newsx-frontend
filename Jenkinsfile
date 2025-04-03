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
                // Ensure Node.js 14 or higher is used
                sh '''
                if ! command -v node &> /dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 14 ]; then
                    echo "Installing Node.js 14..."
                    curl -fsSL https://deb.nodesource.com/setup_14.x | bash -
                    apt-get install -y nodejs
                fi
                echo "Using Node.js version:"
                node -v
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