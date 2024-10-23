#!/bin/sh

# Start Vault in dev mode in the background
vault server -dev &

# Wait for Vault to be ready
echo "Waiting for Vault to be ready..."
sleep 5

# Insert secrets into Vault
vault kv put secret/django \
  DB_NAME=${POSTGRES_DB} \
  DB_USER=${POSTGRES_USER} \
  DB_PASSWORD=${POSTGRES_PASSWORD} \
  DB_HOST=${POSTGRES_HOST} \
  DB_PORT=${POSTGRES_PORT}

# Bring Vault to the foreground to keep the container running
fg %1