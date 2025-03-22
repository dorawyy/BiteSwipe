#!/bin/bash

# deploy_services.sh - Script to deploy and verify BiteSwipe services
# Can be run locally for debugging or called from Terraform

# set -x  # Enable debug output
# Don't exit on error immediately to allow for retries
set +e

echo "[**********************] Service deployment [**********************]"

# --- Configuration ---
# Fixed configuration values
SSH_KEY="$HOME/.ssh/to_azure/CPEN321.pem"
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=10 -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR"
BACKEND_REMOTE_PATH="/app/backend"

# VM_IP is required
VM_IP=""

# Run mode (app or test)
RUN_MODE="app"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --vm-ip=*)
      VM_IP="${1#*=}"
      shift
      ;;
    --run-mode=*)
      RUN_MODE="${1#*=}"
      shift
      ;;
    *)
      echo "Unknown parameter: $1"
      echo "Supported parameters: --vm-ip=<ip_address> --run-mode=<app|test>"
      exit 1
      ;;
  esac
done

# Check if VM_IP is provided
if [ -z "$VM_IP" ]; then
  echo "[Deploy] ERROR: VM_IP is required. Please provide it using --vm-ip=<ip_address>"
  exit 1
fi

# Function to verify SSH connection
verify_ssh() {
  echo "[Deploy] Verifying SSH connection to $VM_IP..."
  for i in {1..5}; do
    ssh $SSH_OPTS -i "$SSH_KEY" adminuser@"$VM_IP" "echo 'SSH test successful'" && return 0
    echo "[Deploy] SSH connection attempt $i failed, retrying in 5 seconds..."
    sleep 5
  done
  echo "[Deploy] Failed to establish SSH connection after 5 attempts"
  return 1
}

# Function to execute commands via SSH
execute_command() {
  # Run via SSH
  ssh $SSH_OPTS -i "$SSH_KEY" adminuser@"$VM_IP" "$1"
  return $?
}

# Function to check command result and exit with error message if failed
check_result() {
  local result=$1
  local error_message=$2
  
  if [ $result -ne 0 ]; then
    echo "[Deploy] ERROR: $error_message"
    exit $result
  fi
  
  return 0
}

# Verify SSH connection first
if ! verify_ssh; then
  echo "[Deploy] Cannot proceed with deployment due to SSH connection failure"
  exit 1
fi

# Start application services with retry logic
echo "[Deploy] Starting Docker services..."

# Split deployment into multiple commands for easier debugging

# 1. Start containers =========================================================

START_APP_CONTAINERS_CMD="
  # set -x
  cd $BACKEND_REMOTE_PATH
  echo '[Deploy] Running application containers...'
  # Run commands separately to avoid syntax issues
  docker-compose -f docker-compose.yml down --remove-orphans && \\
  docker-compose -f docker-compose.yml up -d --build && \\
  docker-compose -f docker-compose.yml logs app || true
  
  # Check container status
  echo '[Deploy] Checking application container status...'
  
  # Wait a moment for containers to initialize
  sleep 5
  # Check the number of running containers
  RUNNING_CONTAINERS=\$(docker-compose -f docker-compose.yml ps --services --filter \"status=running\" | wc -l)
  echo '[Deploy] Number of running containers: ' \$RUNNING_CONTAINERS
  # For application deployment, we expect 3 containers (app, database, nginx)
  EXPECTED_CONTAINERS=3
  
  if [ \"\$RUNNING_CONTAINERS\" -ne \"\$EXPECTED_CONTAINERS\" ]; then
    echo '[Deploy] ERROR: Expected \$EXPECTED_CONTAINERS containers, but only \$RUNNING_CONTAINERS are running'
    docker-compose -f docker-compose.yml ps
    docker-compose -f docker-compose.yml logs
    exit 1
  fi
  
  echo '[Deploy] Application started successfully!'
"

START_TEST_CONTAINERS_CMD="
  # set -x
  cd $BACKEND_REMOTE_PATH
  echo '[Deploy] Running tests...'
  
  # Clean up any existing containers
  docker-compose -f ./docker-compose.test.yml down --remove-orphans
  
  # Start the test container in foreground mode to see output in real-time
  echo '[Deploy] Starting test container...'
  docker-compose -f ./docker-compose.test.yml build --no-cache && docker-compose -f ./docker-compose.test.yml up test
  
  # Get the exit code of the test container
  TEST_EXIT_CODE=\$(docker inspect --format='{{.State.ExitCode}}' test 2>/dev/null || echo 'unknown')
  echo '[Deploy] Test container exit code: ' \$TEST_EXIT_CODE
  
  # Check if tests passed (exit code 0)
  if [ \"\$TEST_EXIT_CODE\" != \"0\" ]; then
    echo '[Deploy] ERROR: Tests failed with exit code \$TEST_EXIT_CODE'
    docker-compose -f ./docker-compose.test.yml ps
    docker-compose -f ./docker-compose.test.yml logs test
    exit 1
  fi
  
  echo '[Deploy] Tests completed successfully!'
"

echo "[Deploy] Starting containers in $RUN_MODE mode"

if [ "$RUN_MODE" = "test" ]; then
  echo "[Deploy] Running in test mode"
  execute_command "$START_TEST_CONTAINERS_CMD"
  check_result $? "Test container startup failed"
else
  echo "[Deploy] Running in app mode"
  execute_command "$START_APP_CONTAINERS_CMD"
  check_result $? "Application container startup failed"
fi

echo "[**********************] Service deployment [**********************]"
