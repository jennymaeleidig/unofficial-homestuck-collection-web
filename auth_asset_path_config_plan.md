# Auth and Asset Server Path Configuration Plan

## Overview

This plan outlines the changes needed to make the SQLite database path for the auth server and the asset directory path for the asset server configurable via environment variables, specifically for Unraid deployment.

## Current State Analysis

### Auth Server (Node.js)

- **File**: `servers/auth_server/database.js`
- **Issue**: Database path is hardcoded as `"db.sqlite"`
- **Dockerfile**: Currently applies a patch to modify the database path to use `process.env.DB_PATH || "db.sqlite"`

### Asset Server (Python)

- **File**: `servers/asset_server/httpserver.py`
- **Issue**: Uses `ROOT_DIR` environment variable
- **Request**: Rename to `ASSET_DIR` for consistency

## Database Creation Behavior

The auth server will automatically create the SQLite database file and necessary table structure even if the DB_PATH points to a new file in an empty folder:

- SQLite automatically creates the database file if it doesn't exist (line 4 in database.js)
- The code attempts to create the user table, and if it already exists, it handles the error gracefully (lines 11-27)
- This means no manual database setup is required when using a new path

## Proposed Changes

### 1. Auth Server Database Path Configuration

**File**: `servers/auth_server/database.js`
**Change**: Replace hardcoded `"db.sqlite"` with `process.env.DB_PATH || "db.sqlite"`

```javascript
// Before
const DBSOURCE = "db.sqlite";

// After
const DBSOURCE = process.env.DB_PATH || "db.sqlite";
```

### 2. Asset Server Directory Path Configuration

**File**: `servers/asset_server/httpserver.py`
**Change**: Replace `ROOT_DIR` with `ASSET_DIR` environment variable

```python
# Before
root_dir = os.environ['ROOT_DIR']

# After
asset_dir = os.environ.get('ASSET_DIR', '/assets')
```

### 3. Docker Configuration Updates

**Files**:

- `docker/auth_server/Dockerfile`
- `docker/asset_server/Dockerfile`
- `docker/docker-compose.yml`
- `docker/docker-compose.dev.yml`

**Changes**:

- Remove patch from auth server Dockerfile
- Update environment variables to use new names
- Ensure default values are set appropriately

### 4. Environment Variable Documentation

Document the following environment variables for Unraid deployment:

- `DB_PATH`: Path to SQLite database file for auth server (default: "db.sqlite")
- `ASSET_DIR`: Path to asset directory for asset server (default: "/assets")

## Implementation Steps

1. Update auth server database.js to use DB_PATH environment variable directly
2. Update asset server httpserver.py to use ASSET_DIR instead of ROOT_DIR
3. Update Dockerfiles to remove patches and set appropriate environment variables
4. Update docker-compose files to use configurable paths
5. Test configuration with sample environment variables
6. Document configuration options for Unraid deployment

## Testing Plan

- Verify auth server starts with default database path
- Verify auth server uses custom database path when DB_PATH is set
- Verify auth server automatically creates database file and tables when DB_PATH points to new location
- Verify asset server serves files from default asset directory
- Verify asset server serves files from custom directory when ASSET_DIR is set
- Test docker-compose configurations with environment variables
