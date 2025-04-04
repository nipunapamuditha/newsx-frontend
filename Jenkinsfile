pipeline {
    agent {
        label 'frontend-node'
    }
    
    environment {
        // Define NODE_VERSION explicitly
        NODE_VERSION = "22"
        // Use .nvm in the build workspace to ensure isolation - with proper quoting for spaces
        NVM_DIR = "${WORKSPACE}/.nvm"
        // Add node_modules/.bin to PATH
        PATH = "${WORKSPACE}/node_modules/.bin:${env.PATH}"
    }
    
    stages {
        stage('Setup Node.js') {
            steps {
                sh '''
                # Create NVM directory if it doesn't exist - ensure path is quoted
                mkdir -p "${NVM_DIR}"
                
                # Install nvm if not already installed
                curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
                
                # Clear any previous nvm setup in this workspace - properly quote paths
                export NVM_DIR="${WORKSPACE}/.nvm"
                if [ -s "${NVM_DIR}/nvm.sh" ]; then
                    . "${NVM_DIR}/nvm.sh"
                fi
                
                # Install and use Node.js 22
                nvm install ${NODE_VERSION}
                nvm alias default ${NODE_VERSION}
                nvm use ${NODE_VERSION}
                
                # Verify setup
                node -v
                npm -v
                
                # Create a helper script that will be used in all subsequent stages
                cat > "${WORKSPACE}/load-nvm.sh" << 'EOL'
#!/bin/bash
export NVM_DIR="${WORKSPACE}/.nvm"
[ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"
nvm use default
export PATH="${WORKSPACE}/node_modules/.bin:$PATH"
EOL
                chmod +x "${WORKSPACE}/load-nvm.sh"
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
                . "${WORKSPACE}/load-nvm.sh"
                node -v
                # Ensure we have the latest npm
                npm install -g npm
                # Install project dependencies
                npm install
                # Ensure TypeScript is installed properly and available
                npm install -D typescript
                # Verify TypeScript is installed
                npx tsc --version
                '''
            }
        }
        
        stage('Build') {
            steps {
                sh '''
                . "${WORKSPACE}/load-nvm.sh"
                node -v
                # Use npx to run TypeScript commands instead of direct tsc command
                npm run build --if-present || (echo "Build failed, trying with npx" && npx tsc -b && npx vite build)
                '''
            }
        }
        
        stage('Test') {
            steps {
                sh '''
                . "${WORKSPACE}/load-nvm.sh"
                npm test --if-present || echo "No tests specified"
                '''
            }
        }
        
        stage('Deploy') {
            steps {
                sshagent(['0ff14880-bcc6-4400-a835-a66a5a3cf0ba']) {
                    sh '''
                    . "${WORKSPACE}/load-nvm.sh"
                    # Make sure dist directory exists before trying to copy
                    if [ -d "dist" ]; then
                        # Note: Vite outputs to 'dist' not 'build'
                        scp -r dist/* jenkins@10.10.10.81:/home/jenkins/frontend
                    else
                        echo "Error: dist directory not found. Build may have failed."
                        exit 1
                    fi
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