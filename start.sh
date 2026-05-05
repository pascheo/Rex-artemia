#!/bin/bash
if [ -n "$CODESPACE_NAME" ]; then
  export VITE_API_URL="https://${CODESPACE_NAME}-3001.app.github.dev"
  echo "Codespaces détecté — API : $VITE_API_URL"
else
  export VITE_API_URL="http://localhost:3001"
  echo "Local — API : $VITE_API_URL"
fi

docker-compose up -d --build frontend
docker-compose up -d postgres backend
