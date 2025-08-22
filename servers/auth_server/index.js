const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./database.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "a very secret key"; // Should be in env in production
const JWT_EXPIRES_IN = "7d";

const app = express();

app.use(
  cors({
    origin: "*",
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization"
    ]
  })
);
app.use(bodyParser.json());

// Explicitly handle OPTIONS requests for CORS preflight
app.options("*", cors());

// JWT authentication middleware
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: "No token provided" });
  }
}

const HTTP_PORT = process.env.AUTH_PORT || 9413;

// Start server
app.listen(HTTP_PORT, "0.0.0.0", () => {
  console.log("Server running on port %PORT%".replace("%PORT%", HTTP_PORT));
  console.log("CORS configuration:", {
    origin: "*",
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization"
    ]
  });
});

// API endpoints will be added here

app.post("/api/signup", (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const saltRounds = 10;
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const insert =
      "INSERT INTO user (username, password, saveData, settings) VALUES (?,?,?,?)";
    const defaultSaveData = JSON.stringify({ saves: {}, saveList: [] });
    const defaultSettings = JSON.stringify({
      newReader: { current: "001901", limit: "001902" },
      notifications: false,
      subNotifications: false,
      forceScrollBar: true,
      smoothScrolling: true,
      pixelScaling: true,
      mspaMode: false,
      bandcampEmbed: true,
      allowSysUpdateNotifs: true,
      lastCheckedUpdate: "",
      themeOverride: "default",
      themeOverrideUI: "default",
      forceThemeOverride: false,
      forceThemeOverrideUI: false,
      textOverride: {
        fontFamily: "",
        bold: false,
        fontSize: 1,
        lineHeight: 1,
        paragraphSpacing: false,
        highContrast: false
      },
      arrowNav: true,
      openLogs: false,
      hqAudio: false,
      jsFlashes: true,
      reducedMotion: false,
      credits: true,
      fastForward: false,
      retcon1: true,
      retcon2: true,
      retcon3: true,
      retcon4: true,
      retcon5: true,
      retcon6: true,
      bolin: true,
      soluslunes: true,
      unpeachy: true,
      pxsTavros: true,
      cursedHistory: true,
      ruffleFallback: true,
      modListEnabled: ["_bolin", "_soluslunes", "_unpeachy", "_pxsTavros"],
      showAddressBar: false,
      useTabbedBrowsing: false
    });
    db.run(insert, [username, hash, defaultSaveData, defaultSettings], err => {
      if (err) {
        if (err.message.includes("UNIQUE constraint failed")) {
          res.status(409).json({ error: "Username already exists" });
        } else {
          res.status(500).json({ error: err.message });
        }
        return;
      }
      res.status(201).json({
        message: "User created successfully",
        username: username,
        success: true
      });
    });
  });
});
app.get("/", (req, res, next) => {
  res.json({ message: "Ok" });
});

// Health check endpoint
app.get("/health", (req, res, next) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.post("/api/login", (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const sql = "select * from user where username = ?";
  db.get(sql, [username], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!row) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    bcrypt.compare(password, row.password, (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (result) {
        const token = jwt.sign(
          { userId: row.id, username: row.username },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );
        res.json({
          message: "success",
          token,
          saveData: JSON.parse(row.saveData),
          settings: JSON.parse(row.settings)
        });
      } else {
        res.status(401).json({ error: "Invalid username or password" });
      }
    });
  });
});

app.post("/api/logout", (req, res, next) => {
  // JWT logout is handled client-side by deleting the token.
  res.json({ message: "Logged out" });
});

app.get("/api/session", authenticateJWT, (req, res, next) => {
  const sql = "select * from user where id = ?";
  db.get(sql, [req.user.userId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!row) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    res.json({
      username: row.username,
      saveData: JSON.parse(row.saveData),
      settings: JSON.parse(row.settings)
    });
  });
});

app.put("/api/data", authenticateJWT, (req, res, next) => {
  const { saveData, settings } = req.body;
  const update = "UPDATE user set saveData = ?, settings = ? WHERE id = ?";
  db.run(
    update,
    [JSON.stringify(saveData), JSON.stringify(settings), req.user.userId],
    function(err, result) {
      if (err) {
        res.status(500).json({ error: res.message });
        return;
      }
      res.json({
        message: "success",
        changes: this.changes
      });
    }
  );
});

// Default response for any other request
app.use(function(req, res) {
  res.status(404);
});
