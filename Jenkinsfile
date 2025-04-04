pipeline {
    agent {
        label 'frontend-node'
    }
    
    environment {
        // Define NODE_VERSION explicitly
        NODE_VERSION = "22"
        // Use .nvm in the build workspace to ensure isolation
        NVM_DIR = "${env.WORKSPACE}/.nvm"
    }
    
    stages {
        stage('Setup Node.js') {
            steps {
                sh '''
                # Create NVM directory if it doesn't exist
                mkdir -p $NVM_DIR
                
                # Install nvm if not already installed
                curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
                
                # Clear any previous nvm setup in this workspace
                export NVM_DIR="$WORKSPACE/.nvm"
                if [ -s "$NVM_DIR/nvm.sh" ]; then
                    . "$NVM_DIR/nvm.sh"
                fi
                
                # Install and use Node.js 22
                nvm install ${NODE_VERSION}
                nvm alias default ${NODE_VERSION}
                nvm use ${NODE_VERSION}
                
                # Verify setup
                node -v
                npm -v
                
                # Create a helper script that will be used in all subsequent stages
                cat > $WORKSPACE/load-nvm.sh << 'EOL'
#!/bin/bash
export NVM_DIR="$WORKSPACE/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use default
EOL
                chmod +x $WORKSPACE/load-nvm.sh
                '''
            }
        }
        
        stage('Checkout') {
            steps {
                git 'https://github.com/nipunapamuditha/newsx-frontend.git'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh '''
                . $WORKSPACE/load-nvm.sh
                node -v
                npm install
                '''
            }
        }
        
        stage('Build') {
            steps {
                sh '''
                . $WORKSPACE/load-nvm.sh
                node -v
                npm run build
                '''
            }
        }
        
        stage('Test') {
            steps {
                sh '''
                . $WORKSPACE/load-nvm.sh
                npm test
                '''
            }
        }
        
        stage('Deploy') {
            steps {
                sshagent(['0ff14880-bcc6-4400-a835-a66a5a3cf0ba']) {
                    sh '''
                    . $WORKSPACE/load-nvm.sh
                    # Note: Vite outputs to 'dist' not 'build'
                    scp -r dist/* jenkins@10.10.10.81:/home/jenkins/frontend
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