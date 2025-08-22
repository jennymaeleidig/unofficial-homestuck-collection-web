// Polyfill for electron-store in webapp mode
module.exports = class StorePolyfill {
  constructor(options = {}) {
    this.migrations = options.migrations || {};
    this.data = {};

    // Load from localStorage if available
    try {
      const stored = localStorage.getItem("electron-store-polyfill");
      if (stored) {
        this.data = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Failed to load stored data:", e);
    }
  }

  get(key, defaultValue) {
    if (key in this.data) {
      return this.data[key];
    }
    return defaultValue;
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }

  has(key) {
    return key in this.data;
  }

  delete(key) {
    delete this.data[key];
    this.save();
  }

  clear() {
    this.data = {};
    this.save();
  }

  save() {
    try {
      localStorage.setItem(
        "electron-store-polyfill",
        JSON.stringify(this.data)
      );
    } catch (e) {
      console.warn("Failed to save data:", e);
    }
  }

  get size() {
    return Object.keys(this.data).length;
  }

  get store() {
    return this.data;
  }

  set store(value) {
    this.data = value;
    this.save();
  }
};
