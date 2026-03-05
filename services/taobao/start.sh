#!/bin/bash
# Start script for Railway deployment
# Railway sets PORT environment variable automatically

PORT=${PORT:-8000}
echo "Starting uvicorn on port $PORT"
exec uvicorn main:app --host 0.0.0.0 --port $PORT
