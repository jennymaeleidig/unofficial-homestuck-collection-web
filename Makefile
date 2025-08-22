-include .env

# Default asset server configuration
ASSET_PACK_HREF ?= http://localhost:8413/

# Default auth server configuration
AUTH_SERVER_URL ?= http://localhost:9413

.SECONDEXPANSION:
.SUFFIXES:

default: serve

## Setup

# We do actually use a dummy install file to track this
yarn.lock: package.json
	yarn install --ignore-optional --ignore-engines
	touch yarn.lock

install: package.json yarn.lock
	yarn install --ignore-engines

## Prep actions

.PHONY: clean
clean:
	yarn cache clean
	-rm yarn-error.log
	-rm ./install src/imods.tar.gz
	-rm -rf node_modules/.cache/
	-rm -rf dist/
	-rm build/webAppModTrees.json

.PHONY: lint
lint: install
	yarn run vue-cli-service lint

## Intermediate files

SHARED_INTERMEDIATE=src/imods.tar.gz src/js/crc_imods.json

src/imods.tar.gz: $(wildcard src/imods/*) $(wildcard src/imods/*/*)
	# cd src && tar -czf imods.tar.gz imods/
	cd src && tar -cf - imods/ | gzip -9 - > imods.tar.gz

src/js/crc_imods.json: src/imods.tar.gz
	yarn exec node src/js/validation.js src/imods/ src/js/crc_imods.json

# browser.js must be built with known environment variables, not static
WEBAPP_INTERMEDIATE=build/webAppModTrees.json

build/webAppModTrees.json: webapp/browser.js.j2 .env
	mkdir -p build/
	# External mod support removed - only scan imods directory
	# Source .env to get ASSET_DIR
	bash -c 'set -a; source .env; set +a; cd "$${ASSET_DIR}"; tree archive/imods -J | jq '"'"'. | walk(if type == "object" then (if .type == "file" then ({"key": (.name), "value": true}) elif has("contents") then {"key": (.name), "value": .contents|from_entries} else . end) else . end) | .[:-1] | from_entries'"'"'' > build/webAppModTrees.json

# Requires `python3 -m pip install jinja2-cli`
.PHONY: webapp/browser.js
webapp/browser.js:
	env APP_VERSION=`jq -r '.version' < package.json` \
		ASSET_PACK_HREF="${ASSET_PACK_HREF}" \
		ASSET_DIR="${ASSET_DIR}" \
		AUTH_SERVER_URL="${AUTH_SERVER_URL}" \
			jinja2 webapp/browser.js.j2 > webapp/browser.js

# src/js/crc_pack.json:
# 	yarn exec node src/js/validation.js "${ASSET_DIR}" src/js/crc_pack.json

# Note: browser.js is not a determinate intermediate file because it depends on envars and parameters!

## Running live

# Legacy target for compatibility - redirects to serve
.PHONY: test
test: serve

.PHONY: ensure-asset-server
ensure-asset-server:
	@if ! pgrep -f "python3.*httpserver.py" >/dev/null; then \
		ASSET_DIR="${ASSET_DIR}" python3 servers/asset_server/httpserver.py & \
		echo $$! > .asset-server.pid; \
	fi

.PHONY: ensure-auth-server
ensure-auth-server:
	@if ! pgrep -f "node.*servers/auth_server/index.js" >/dev/null; then \
		cd servers/auth_server && npm start & \
		echo $$! > .auth-server.pid; \
	fi

.PHONY: serve
serve: install ${SHARED_INTERMEDIATE} ${WEBAPP_INTERMEDIATE} webapp/browser.js
	@trap 'printf "\nShutting down servers...\n"; pkill -f "python3.*httpserver.py" 2>/dev/null; pkill -f "node.*servers/auth_server/index.js" 2>/dev/null; kill $$(jobs -p) 2>/dev/null; rm -f .asset-server.pid .auth-server.pid; exit 0' EXIT INT TERM; \
	make ensure-asset-server; \
	make ensure-auth-server; \
	env ASSET_PACK_HREF="${ASSET_PACK_HREF}" AUTH_SERVER_URL="${AUTH_SERVER_URL}" yarn run vue-cli-service serve webapp/browser.js & \
	nodemon --exec "make webapp/browser.js" --watch "webapp" -e "j2" & \
	wait || true

## Building output

.PHONY: build
build: install ${SHARED_INTERMEDIATE} ${WEBAPP_INTERMEDIATE}
	env ASSET_DIR="${ASSET_DIR}" \
		ASSET_PACK_HREF="${ASSET_PACK_HREF}" \
		AUTH_SERVER_URL="${AUTH_SERVER_URL}" \
			make webapp/browser.js
	env NODE_OPTIONS=--max_old_space_size=8192 \
		ASSET_DIR="${ASSET_DIR}" \
		ASSET_PACK_HREF="${ASSET_PACK_HREF}" \
		AUTH_SERVER_URL="${AUTH_SERVER_URL}" \
			yarn run vue-cli-service build webapp/browser.js
			
			
.PHONY: help
help:
	grep -E '(^[^.#[:space:]].*:)|(##)' Makefile
