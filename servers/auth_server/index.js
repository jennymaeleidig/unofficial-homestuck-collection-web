const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./database.js");
const bcrypt = require("bcrypt");
const session = require("express-session");
const FileStore = require("session-file-store")(session);

const app = express();

app.use(
  cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow requests from localhost and the IP address in the .env file
      const allowedOrigins = [
        "http://localhost:8080",
        "http://192.168.1.236:8080"
      ];

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);
app.use(bodyParser.json());
app.use((req, res, next) => {
  console.log("Request headers:", req.headers);

  // Force clear invalid session cookie if session file is missing (ENOENT)
  if (
    req.sessionID &&
    req.sessionStore &&
    typeof req.sessionStore.get === "function"
  ) {
    req.sessionStore.get(req.sessionID, (err, session) => {
      if (err && err.code === "ENOENT") {
        res.clearCookie("connect.sid", {
          path: "/",
          sameSite: "none",
          secure: true
        });
        console.log(
          "Force-cleared invalid session cookie for sessionID:",
          req.sessionID
        );
      }
      next();
    });
  } else {
    next();
  }
});

app.use(
  session({
    store: new FileStore({
      path: "./sessions",
      ttl: 60 * 60 * 24 * 7,
      retries: 5
    }),
    secret: "a very secret key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      sameSite: "none"
    },
    proxy: true
  })
);

app.use((req, res, next) => {
  console.log("Session after middleware:", req.sessionID, req.session);
  next();
});

const HTTP_PORT = 8000;

// Start server
app.listen(HTTP_PORT, "0.0.0.0", () => {
  console.log("Server running on port %PORT%".replace("%PORT%", HTTP_PORT));
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
        req.session.userId = row.id;
        req.session.username = row.username;
        req.session.save(err => {
          if (err) {
            console.error("Failed to save session:", err);
            res.status(500).json({ error: "Failed to save session" });
            return;
          }
          console.log("Session saved successfully, session ID:", req.sessionID);
          res.json({
            message: "success",
            saveData: JSON.parse(row.saveData),
            settings: JSON.parse(row.settings)
          });
        });
      } else {
        res.status(401).json({ error: "Invalid username or password" });
      }
    });
  });
});

app.post("/api/logout", (req, res, next) => {
  req.session.destroy(err => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: "Logged out" });
  });
});

app.get("/api/session", (req, res, next) => {
  if (req.session.userId) {
    const sql = "select * from user where id = ?";
    db.get(sql, [req.session.userId], (err, row) => {
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
  } else {
    res.status(401).json({ error: "Not logged in" });
  }
});

app.put("/api/data", (req, res, next) => {
  if (req.session.userId) {
    const { saveData, settings } = req.body;
    const update = "UPDATE user set saveData = ?, settings = ? WHERE id = ?";
    db.run(
      update,
      [JSON.stringify(saveData), JSON.stringify(settings), req.session.userId],
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
  } else {
    res.status(401).json({ error: "Not logged in" });
  }
});

// Default response for any other request
app.use(function(req, res) {
  res.status(404);
});
