pipeline {
    agent any

    environment {
        APP_DIR = "/home/ubuntu/luminaq-docker"
        TEST_REPO = "https://github.com/maimoona-mustafvi/luminaq-selenium-tests.git"
        TEST_DIR = "/tmp/luminaq-selenium-tests"
    }

    stages {
        stage('Checkout App Code') {
            steps {
                echo 'Checking out application code from GitHub...'
                checkout scm
            }
        }

        stage('Pull Latest Code on EC2') {
            steps {
                echo 'Pulling latest code on EC2 instance...'
                sh '''
                    cd ${APP_DIR}
                    git pull origin main
                '''
            }
        }

        stage('Start Website Containers') {
            steps {
                echo 'Starting website containers on port 5001...'
                sh '''
                    cd ${APP_DIR}
                    # Stop any existing containers first
                    docker-compose -f docker-compose-jenkins.yml down || true
                    # Start fresh containers
                    docker-compose -f docker-compose-jenkins.yml up -d
                    echo "Website started on port 5001"
                '''
            }
        }

        stage('Wait for Website') {
            steps {
                echo 'Waiting for website to be ready...'
                sh '''
                    echo "Waiting for website to respond..."
                    for i in 1 2 3 4 5 6 7 8 9 10; do
                        if curl -f http://localhost:5001 > /dev/null 2>&1; then
                            echo "Website is ready!"
                            exit 0
                        fi
                        echo "Attempt $i: Website not ready, waiting 5 seconds..."
                        sleep 5
                    done
                    echo "Website may not be fully ready, continuing tests..."
                '''
            }
        }

        stage('Run Selenium Tests') {
            steps {
                echo 'Running Selenium tests against website...'
                sh '''
                    # Clone or update test repository
                    rm -rf ${TEST_DIR}
                    git clone ${TEST_REPO} ${TEST_DIR}
                    cd ${TEST_DIR}

                    # Build Docker image for tests
                    docker build -t luminaq-selenium-tests .

                    # Run tests against deployed website
                    docker run --rm --network host \
                        luminaq-selenium-tests

                    echo "Selenium tests completed"
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
            emailext (
                subject: "SUCCESS: LuminaQ Pipeline - Build #${env.BUILD_NUMBER} - Tests Passed",
                body: """
                    Pipeline completed successfully.

                    Website URL: http://3.6.223.82:5001

                    Build Details:
                    - Build Number: ${env.BUILD_NUMBER}
                    - Build URL: ${env.BUILD_URL}
                    - Tests: All 10 Selenium tests passed
                    - Triggered by: ${env.CHANGE_AUTHOR_DISPLAY_NAME ?: 'GitHub user'}

                    The website is now running on port 5001.
                """,
                to: "mustafvimaimoona@gmail.com"
            )
        }
        failure {
            echo 'Pipeline failed!'
            emailext (
                subject: "FAILURE: LuminaQ Pipeline - Build #${env.BUILD_NUMBER} - Tests Failed",
                body: """
                    Pipeline failed. Please check the logs.

                    Build URL: ${env.BUILD_URL}
                    Triggered by: ${env.CHANGE_AUTHOR_DISPLAY_NAME ?: 'GitHub user'}

                    Check Jenkins console output for details.
                """,
                to: "mustafvimaimoona@gmail.com"
            )
        }
    }
}
