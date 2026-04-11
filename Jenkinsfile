pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Stop Old Containers') {
            steps {
                sh '''
                    docker-compose -f docker-compose-jenkins.yml down --remove-orphans || true
                '''
            }
        }

        stage('Start Application') {
            steps {
                sh '''
                    docker-compose -f docker-compose-jenkins.yml up -d
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    sleep 10
                    docker ps | grep luminaq-app-ci
                    curl -f http://localhost:5001 || echo "Waiting for app"
                '''
            }
        }
    }

    post {
        success {
            echo 'Deployment successful on port 5001'
        }
        failure {
            echo 'Deployment failed'
        }
    }
}
