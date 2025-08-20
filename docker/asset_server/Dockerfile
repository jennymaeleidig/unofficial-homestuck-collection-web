# Dockerfile for Asset Server
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy the http server script
COPY servers/asset_server/httpserver.py .

# Define build argument with default value
ARG ASSET_PACK_PORT=7413

# Set environment variable for asset directory and port
ENV ASSET_DIR=/assets
ENV ASSET_PACK_PORT=${ASSET_PACK_PORT}

# Expose port
EXPOSE ${ASSET_PACK_PORT}

# Define volume for asset folder
VOLUME ["/assets"]

# Run the server with the specified port
CMD ["python3", "httpserver.py"]