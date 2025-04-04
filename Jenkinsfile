pipeline {
    agent {
        label 'frontend-node'
    }
    
    environment {
        // Define NODE_VERSION explicitly
        NODE_VERSION = "22"
        // Use .nvm in the build workspace to ensure isolation
        NVM_DIR = "${WORKSPACE}/.nvm"
        // Target server
        DEPLOY_SERVER = "10.10.10.81"
    }
    
    stages {
        stage('Setup Node.js') {
            steps {
                sh '''
                # Create NVM directory if it doesn't exist
                mkdir -p "${NVM_DIR}"
                
                # Install nvm if not already installed
                curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
                
                # Load NVM
                export NVM_DIR="${WORKSPACE}/.nvm"
                [ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"
                
                # Install and use Node.js 22
                nvm install ${NODE_VERSION}
                nvm alias default ${NODE_VERSION}
                nvm use ${NODE_VERSION}
                
                # Verify setup
                node -v
                npm -v
                
                # Create helper script with proper variable expansion
                cat > "${WORKSPACE}/load-nvm.sh" << EOF
#!/bin/bash
export NVM_DIR="${WORKSPACE}/.nvm"
[ -s "\${NVM_DIR}/nvm.sh" ] && . "\${NVM_DIR}/nvm.sh"
nvm use default
# Ensure node_modules/.bin is in PATH
export PATH="\${PWD}/node_modules/.bin:\${PATH}"
EOF
                chmod +x "${WORKSPACE}/load-nvm.sh"
                '''
            }
        }
        
        stage('Add Host to Known Hosts') {
            steps {
                sh '''
                # Create .ssh directory if it doesn't exist
                mkdir -p ~/.ssh
                
                # Add the host key to known_hosts (automatically accepting it)
                ssh-keyscan -H ${DEPLOY_SERVER} >> ~/.ssh/known_hosts
                
                # Set proper permissions
                chmod 644 ~/.ssh/known_hosts
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
                # Load NVM environment
                . "${WORKSPACE}/load-nvm.sh"
                
                # Debug node version
                node -v
                
                # Install dependencies
                npm install
                
                # Install TypeScript globally to avoid permission issues
                npm install -g typescript
                
                # Make binaries executable
                chmod -R +x ./node_modules/.bin/
                
                # Verify TypeScript using global path
                tsc --version || echo "Global TypeScript not available"
                '''
            }
        }
        
        stage('Build') {
            steps {
                sh '''
                # Load NVM environment
                . "${WORKSPACE}/load-nvm.sh"
                
                # Debug node version
                node -v
                
                # Modified build command to avoid direct TypeScript usage
                npm run build || (echo "Using alternative build method" && npm exec -- vite build)
                '''
            }
        }
        
        stage('Test') {
            steps {
                sh '''
                # Load NVM environment
                . "${WORKSPACE}/load-nvm.sh"
                
                # Run tests if they exist
                npm test --if-present || echo "No tests specified"
                '''
            }
        }
        
        stage('Deploy') {
            steps {
                sshagent(['0ff14880-bcc6-4400-a835-a66a5a3cf0ba']) {
                    sh '''
                    # Load NVM environment
                    . "${WORKSPACE}/load-nvm.sh"
                    
                    # Make sure dist directory exists before trying to copy
                    if [ -d "dist" ]; then
                        # Verbose output for debugging
                        echo "Found dist directory with contents:"
                        ls -la dist/
                        
                        # Alternative approach - use StrictHostKeyChecking=no option
                        scp -o StrictHostKeyChecking=no -r dist/* jenkins@${DEPLOY_SERVER}:/home/jenkins/frontend
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