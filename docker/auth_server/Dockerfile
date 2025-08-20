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

# Apply patch to use DB_PATH environment variable
RUN sed -i 's/const DBSOURCE = "db.sqlite";/const DBSOURCE = process.env.DB_PATH || "db.sqlite";/' database.js

# Expose port 9413
EXPOSE 9413

# Define volume for database
VOLUME ["/data"]

# Set environment variable for database path
ENV DB_PATH=/data/db.sqlite

# Run the server
CMD ["node", "index.js"]