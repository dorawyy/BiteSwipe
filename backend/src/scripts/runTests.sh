#!/bin/bash
set -e

# Use only a single DB_URI variable with default to localhost if not set
DB_URI=${DB_URI:-"mongodb://localhost:27017"}
DB_NAME=${DB_NAME:-"biteswipe_test"}

echo "MongoDB config for tests: Connection URI = ${DB_URI}, Database = ${DB_NAME}"

# Extract host and port from DB_URI for mongo command-line tools
DB_HOST=$(echo $DB_URI | sed -n 's/.*mongodb:\/\/\([^:]*\).*/\1/p')
if [ -z "$DB_HOST" ]; then
  DB_HOST="localhost"
fi

DB_PORT=$(echo $DB_URI | sed -n 's/.*mongodb:\/\/[^:]*:\([^\/]*\).*/\1/p')
if [ -z "$DB_PORT" ]; then
  DB_PORT="27017"
fi

echo "Extracted MongoDB settings: Host=${DB_HOST}, Port=${DB_PORT}, DB=${DB_NAME}"


echo "Database is empty or force seeding is enabled - running seed script..."
  
# Export DB_URI for the seed script to use
export DB_URI

# Run the tests with coverage
echo "Running unmocked tests with coverage..."
# Use --silent flag to suppress console output during tests
exec npm run test:coverage:unmocked -- --silent
