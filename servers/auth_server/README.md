# Auth Server Session Management

This document describes how session management and cleanup works in the authentication server.

## Session Storage

Sessions are stored as JSON files in the `sessions/` directory using the `session-file-store` package. Each session file contains:

- Cookie information including expiration timestamp
- User identification data
- Last access timestamp

## Session Cleanup

To prevent the accumulation of expired and unused session files, the server implements automatic cleanup functionality.

### Automatic Cleanup

The server automatically performs session cleanup:

1. **On Startup**: An initial cleanup runs when the server starts
2. **Periodically**: Cleanup runs every hour while the server is running

### Manual Cleanup

You can also run cleanup manually using npm:

```bash
npm run cleanup-sessions
```

Or directly with Node.js:

```bash
node cleanup-sessions.js
```

### Cleanup Logic

The cleanup script removes session files based on:

1. **Expired Sessions**: Sessions where the cookie expiration timestamp is in the past (plus a 1-day grace period)
2. **Inactive Sessions**: Sessions that haven't been accessed in 30 days (configurable)

### Configuration

The cleanup behavior can be configured in `cleanup-sessions.js`:

```javascript
const CONFIG = {
  // Delete sessions expired more than this many days ago
  expiredDaysThreshold: 1,
  // Delete sessions not accessed in this many days (0 = disable)
  inactiveDaysThreshold: 30,
};
```

## Session Expiration

Sessions are configured to expire after 7 days of inactivity, matching the cookie's `maxAge` setting.
