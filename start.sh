#!/bin/bash

if [ -n "$CODESPACE_NAME" ]; then
  export VITE_API_URL="https://${CODESPACE_NAME}-3001.app.github.dev"
  echo "Mode Codespaces détecté — API URL : $VITE_API_URL"
else
  export VITE_API_URL="http://localhost:3001"
  echo "Mode local — API URL : $VITE_API_URL"
fi

VITE_API_URL=$VITE_API_URL docker-compose up -d --build
