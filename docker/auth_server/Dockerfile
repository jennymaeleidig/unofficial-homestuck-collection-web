# Dockerfile for Auth Server
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY servers/auth_server/package.json servers/auth_server/package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY servers/auth_server/ .

# Define build argument with default value
ARG AUTH_PORT=9413

# Set environment variable for database path and port
ENV DB_PATH=/data/db.sqlite
ENV AUTH_PORT=${AUTH_PORT}

# Expose port
EXPOSE ${AUTH_PORT}

# Define volume for database
VOLUME ["/data"]

# Run the server
CMD ["node", "index.js"]