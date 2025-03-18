#!/bin/bash
set -e

# Use only a single DB_URI variable with default to localhost if not set
DB_URI=${DB_URI:-"mongodb://localhost:27017"}
DB_NAME=${DB_NAME:-"biteswipe"}

echo "MongoDB config: Connection URI = ${DB_URI}, Database = ${DB_NAME}"

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

# Run the seed script with current environment
node -r dotenv/config ./node_modules/.bin/ts-node src/scripts/seedDatabase.ts

if [ $? -eq 0 ]; then
  echo "Database seeded successfully"
else
  echo "Error: Database seeding failed"
  # Continue anyway - the app might work with existing data
fi

# Start the application with the current environment
echo "Starting application..."
exec node -r dotenv/config ./dist/index.js