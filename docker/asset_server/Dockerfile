# Dockerfile for Asset Server
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy the http server script
COPY servers/asset_server/httpserver.py .

# Expose port 7413
EXPOSE 7413

# Define volume for asset folder
VOLUME ["/assets"]

# Set environment variable for root directory
ENV ROOT_DIR=/assets

# Run the server
CMD ["python3", "httpserver.py"]