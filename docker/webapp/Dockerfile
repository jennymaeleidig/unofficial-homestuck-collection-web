# Multi-stage Dockerfile for Unofficial Homestuck Collection Web App

# Build stage
FROM node:18 AS build

# Increase Node.js memory limit to 8GB
ENV NODE_OPTIONS=--max_old_space_size=8192

# Install python3 and pip for jinja2-cli
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv tree jq && rm -rf /var/lib/apt/lists/*

# Create a virtual environment and install jinja2-cli
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install jinja2-cli

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile --ignore-engines

# Copy source code
COPY . .

# Define build arguments with default values
ARG ASSET_PACK_HREF=https://assets.homestuck.barb.date//:${ASSET_PACK_PORT:-7413}/
ARG AUTH_SERVER_URL=https://auth.homestuck.barb.date:${AUTH_PORT:-9413}
ARG APP_VERSION=2.7.2
ARG ASSET_DIR=/assets/
ARG WEB_PORT=8413

# Set environment variables from build arguments
ENV ASSET_PACK_HREF=${ASSET_PACK_HREF}
ENV AUTH_SERVER_URL=${AUTH_SERVER_URL}
ENV APP_VERSION=${APP_VERSION}
ENV ASSET_DIR=${ASSET_DIR}
ENV WEB_PORT=${WEB_PORT}

# Render browser.js from browser.js.j2 template and build the Vue application
# Explicitly pass environment variables to ensure correct path generation

# Generate intermediate files required by the application
RUN mkdir -p build/
RUN cd src && tar -cf - imods/ | gzip -9 - > imods.tar.gz
RUN yarn exec node src/js/validation.js src/imods/ src/js/crc_imods.json
RUN tree -J src/imods | jq '. | walk(if type == "object" then (if .type == "file" then ({"key": (.name), "value": true}) elif has("contents") then {"key": (.name), "value": .contents|from_entries} else . end) else . end) | .[:-1] | from_entries' > build/webAppModTrees.json

# Build the Vue application
RUN ASSET_PACK_HREF=${ASSET_PACK_HREF} \
    ASSET_DIR=${ASSET_DIR} \
    APP_VERSION=${APP_VERSION} \
    AUTH_SERVER_URL=${AUTH_SERVER_URL} \
    WEB_PORT=${WEB_PORT} \
    jinja2 webapp/browser.js.j2 -o webapp/browser.js && yarn run vue-cli-service build webapp/browser.js

# Remove the asset files after the build to keep the image size manageable
RUN rm -rf /assets

# Runtime stage
FROM nginx:alpine AS runtime

# Copy nginx configuration
COPY docker/nginx/webapp.conf /etc/nginx/conf.d/default.conf

# Copy built application from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]