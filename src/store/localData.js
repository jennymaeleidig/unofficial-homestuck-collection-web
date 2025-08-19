import Vue from "vue";
import axios from "axios";
const semver = require("semver");

// Set up axios to use JWT token from localStorage
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

const API_BASE_URL =
  typeof window !== "undefined" && window.webAppAuthServerUrl
    ? `${window.webAppAuthServerUrl}/api`
    : typeof process !== "undefined" && process.env.AUTH_SERVER_URL
    ? `${process.env.AUTH_SERVER_URL}/api`
    : "http://localhost:9413/api";

// isWebApp for main-process electron execution
const isWebApp = (typeof window !== "undefined" && window.isWebApp) || false;

const migrations = {
  "2.3.0": store => {
    // Migrate storage
    console.log("Migrating localData monolith for 2.3.0");
    const local_data_prev = store.get("localData", {});
    store.delete("localData");
    store.set(local_data_prev);
  },
  "2.4.4": store => {
    // Migrate storage
    console.log("Migrating line height for 2.4.4");
    const settings_prev = store.get("settings", {});
    if (settings_prev && settings_prev.textOverride) {
      const incremented_height =
        Number(settings_prev.textOverride.lineHeight) + 1;
      store.set("settings.textOverride.lineHeight", incremented_height);
    }
  },
  "2.5.8": store => {
    console.log("Migrating text size for 2.5.8");
    const settings_prev = store.get("settings", {});
    if (settings_prev && settings_prev.textOverride) {
      const incremented_size = Number(settings_prev.textOverride.fontSize) + 1;
      console.log(
        "textOverride.fontSize:",
        settings_prev.textOverride.fontSize,
        "->",
        incremented_size
      );
      store.set("settings.textOverride.fontSize", incremented_size);
    }
  },
  "2.6.9": store => {
    const settings_prev = store.get("settings", {});
    if (settings_prev && !isWebApp && settings_prev.ruffleFallback) {
      store.set("settings.ruffleFallback", false);
    }
  }
};

var log;
if (!window.isWebApp) {
  const Store = require("electron-store");
  // store = new Store({ migrations }); // No longer needed
  log = require("Logger");
} else {
  // store = require("@/../webapp/localstore.js"); // No longer needed
  log = {
    scope() {
      return console;
    }
  };
}

const LOADED_TAB_LIMIT = 10;
const DEAD_TAB_LIMIT = 15;
const HISTORY_LIMIT = 350;

const DEFAULT_TABDATA = {
  activeTabKey: "000",
  tabs: {
    "000": {
      key: "000",
      url: "/",
      title: "",
      hasEmbed: false,
      history: [],
      future: []
    }
  },
  tabList: ["000"],
  sortedTabList: ["000"],
  closedTabList: []
};

// Import mod tree data
let modTree;
try {
  modTree = require("@/../build/webAppModTrees.json");
} catch (e) {
  console.warn("Failed to load mod tree data:", e);
  modTree = { "archive/imods": {} };
}

// Default mod list in case no mods are found
const DEFAULT_MODS = ["_bolin", "_soluslunes", "_unpeachy", "_pxsTavros"];

// Get list of available mods from archive/imods directory
const getAvailableMods = () => {
  try {
    const modsDir = modTree["archive/imods"] || {};
    const mods = Object.keys(modsDir)
      // Only include .js files that are actual mods (start with _)
      .filter(
        key =>
          key.startsWith("_") && key.endsWith(".js") && !key.endsWith(".js-E")
      )
      .map(key => key.replace(".js", ""));

    // Return default mods if none found in tree
    return mods.length > 0 ? mods : DEFAULT_MODS;
  } catch (e) {
    console.warn("Error parsing mod list:", e);
    return DEFAULT_MODS;
  }
};

const DEFAULT_SETTINGS = {
  newReader: {
    current: "001901",
    limit: "001902"
  },
  notifications: false,
  subNotifications: false,

  forceScrollBar: true,
  smoothScrolling: true,
  pixelScaling: true,
  mspaMode: false, // Ensure MSPA page numbers are disabled by default
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

  // Dynamically enable mods based on what's available in the asset pack
  modListEnabled: getAvailableMods(),
  ...(window.webAppOpinionatedDefaults
    ? {
        ...window.webAppOpinionatedDefaults,
        mspaMode: false // Always override mspaMode to false regardless of opinionated defaults
      }
    : {})
};

const DEFAULT_SAVEDATA = {
  saves: {},
  saveList: []
};

class LocalData {
  constructor(init) {
    const data = init || {
      assetDir: "web", // Always set assetDir to "web"
      tabData: DEFAULT_TABDATA,
      saveData: DEFAULT_SAVEDATA,
      settings: DEFAULT_SETTINGS
    };

    this.VM = new Vue({
      data: () => ({
        ...data,
        isAuthenticated: false, // Add isAuthenticated property
        temp: {
          visited: [],
          loadedTabList: [],
          tabChainIndex: undefined,
          isPoppingState: false,
          saveDebounce: false
        }
      }),
      computed: {
        $logger() {
          return log.scope("localData");
        },
        activeTabIndex() {
          return this.tabData.sortedTabList.indexOf(this.tabData.activeTabKey);
        },
        activeTabObject() {
          return this.tabData.tabs[this.tabData.activeTabKey];
        },
        allHistory() {
          return this.tabData.tabList
            .map(key => this.tabData.tabs[key])
            .reduce((a, t) => {
              a.push(t.url);
              return a.concat(t.history);
            }, []);
        },
        openUrls() {
          return this.tabData.tabList
            .map(key => this.tabData.tabs[key])
            .map(tab => tab.url);
        }
      },
      methods: {
        _migrateStorage(new_version) {
          // This method is a placeholder to prevent errors.
          // Actual migration logic (if any) would go here.
          // For now, we assume the data is already in the correct format.
          console.log("Migration check for version", new_version, "skipped.");
        },
        async _saveLocalStorage() {
          if (this.saveDebounce) {
            clearTimeout(this.saveDebounce);
            this.saveDebounce = undefined;
          }
          try {
            await axios.put(`${API_BASE_URL}/data`, {
              saveData: this.saveData,
              settings: this.settings
            });
            this.$logger.info("Data saved to server.");
          } catch (e) {
            this.$logger.error("Failed to save data to server:", e);
            // Optionally, fall back to local storage or show an error to the user
          }
        },
        applySaveIfPending() {
          if (this.saveDebounce) {
            this._saveLocalStorage();
          }
        },
        saveLocalStorage() {
          if (this.saveDebounce) clearTimeout(this.saveDebounce);
          this.saveDebounce = setTimeout(this._saveLocalStorage, 1000);
        },
        async reloadLocalStorage() {
          this.applySaveIfPending();
          try {
            const response = await axios.get(`${API_BASE_URL}/session`);
            const { saveData, settings } = response.data;
            this.saveData = saveData;
            this.settings = settings;
            this.$logger.info("Data reloaded from server.");
          } catch (e) {
            this.$logger.error("Failed to reload data from server:", e);
            // If no session or error, prompt for login/signup
            // This part will be handled in the install method
          }

          // The rest of the reloadLocalStorage logic remains the same for tabData
          // as tabData is not persisted on the server per user.
          // If tabData needs to be persisted, it would require a separate API.
          const all = {
            assetDir: this.assetDir || "", // assetDir is not part of user data, so keep it local
            tabData: this.tabData || DEFAULT_TABDATA // tabData is not part of user data, so keep it local
          };
          const back = {
            assetDir: all["assetDir"] || "",
            saveData: this.saveData || DEFAULT_SAVEDATA,
            settings: { ...DEFAULT_SETTINGS, ...this.settings },
            tabData: all["tabData"] || DEFAULT_TABDATA
          };

          this.assetDir = "web"; // Always set assetDir to "web"
          // this.saveData = back.saveData; // Already set from API
          // this.settings = back.settings; // Already set from API
          if (this.settings.useTabbedBrowsing) {
            this.temp.isPoppingState = true;
            this.tabData = back.tabData;
            this.$nextTick(_ => {
              // Watcher runs here
              this.$nextTick(_ => {
                // If the watcher *didn't* run (path was root) unset flag now
                this.temp.isPoppingState = false;
              });
            });
          }
        },
        clearLocalStorage() {
          // This method will now clear local client-side state, not server data
          this.applySaveIfPending();
          this.assetDir = "web"; // Always set assetDir to "web"
          this.tabData = DEFAULT_TABDATA;
          this.saveData = DEFAULT_SAVEDATA;
          this.settings = DEFAULT_SETTINGS;
          // No server call here, as this is a client-side reset
        },
        HISTORY_CLEAR() {
          this.tabData.tabList.forEach(k => {
            this.tabData.tabs[k].history = [];
          });
          this.saveLocalStorage();
        },
        TABS_RESET() {
          this.$set(this, "tabData", {
            activeTabKey: "000",
            tabs: {
              "000": {
                key: "000",
                url: "/",
                title: "",
                hasEmbed: false,
                history: [],
                future: []
              }
            },
            tabList: ["000"],
            sortedTabList: ["000"],
            closedTabList: []
          });
          this.temp.loadedTabList = [];
          this.temp.tabChainIndex = undefined;

          this.saveLocalStorage();
        },

        TABS_PUSH_URL(url = "/", key = this.tabData.activeTabKey) {
          window.getSelection().empty();
          try {
            document.getElementById(key).scrollTop = 0;
            document.getElementById(key).scrollLeft = 0;
          } catch {
            console.warn("Tab key element not loaded in document", key);
          }

          if (window.isWebApp) {
            // In webapp mode, use browser history
            window.history.pushState({ tabData: this.tabData }, "", url);
          }

          this.tabData.tabs[key].history.push(this.tabData.tabs[key].url);
          this.tabData.tabs[key].future = [];
          while (this.tabData.tabs[key].history.length > HISTORY_LIMIT)
            this.tabData.tabs[key].history.shift();
          this.$set(this.tabData.tabs[key], "url", url);

          this.push_new_history();
          this.saveLocalStorage();
        },

        TABS_NEW(url = "/", adjacent = false) {
          if (!this.settings.useTabbedBrowsing || window.isWebApp) {
            return this.TABS_PUSH_URL(url);
          }
          let key;
          do {
            key = Math.random()
              .toString(36)
              .substring(2, 5);
          } while (key in this.tabData.tabs);

          this.$set(this.tabData.tabs, key, {
            key: key,
            url: url,
            title: "",
            hasEmbed: false,
            history: [],
            future: []
          });

          this.tabData.tabList.push(key);

          // If adjacent, chain new tabs along in sequence next to the current tab. Otherwise, place tab at end of array
          if (adjacent) {
            this.temp.tabChainIndex = this.temp.tabChainIndex
              ? this.temp.tabChainIndex + 1
              : this.activeTabIndex + 1;
            this.tabData.sortedTabList.splice(this.temp.tabChainIndex, 0, key);
          } else {
            this.tabData.sortedTabList.push(key);
          }

          if (this.tabData.tabList.length > this.tabData.sortedTabList.length)
            this.TABS_RESYNC();

          if (
            !adjacent ||
            this.tabData.tabList.length == 1 ||
            this.settings.switchToNewTabs
          ) {
            this.TABS_SWITCH_TO(key);
          } else {
            // TABS_SWITCH_TO also saves localStorage, so we only need to run this here if we're not switching tabs
            this.saveLocalStorage();
          }
        },

        TABS_DUPLICATE(
          target = this.tabData.activeTabKey,
          adjacent = true,
          historyMode = false
        ) {
          if (target in this.tabData.tabs) {
            if (!this.settings.useTabbedBrowsing) {
              return;
            }
            let key;
            do {
              key = Math.random()
                .toString(36)
                .substring(2, 5);
            } while (key in this.tabData.tabs);

            this.tabData.tabList.push(key);

            // If adjacent, chain new tabs along in sequence next to the current tab. Otherwise, place tab at end of array
            if (adjacent) {
              this.temp.tabChainIndex = this.temp.tabChainIndex
                ? this.temp.tabChainIndex + 1
                : this.activeTabIndex + 1;
              this.tabData.sortedTabList.splice(
                this.temp.tabChainIndex,
                0,
                key
              );
            } else {
              this.tabData.sortedTabList.push(key);
            }

            const targetTab = this.tabData.tabs[target];

            let url = targetTab.url;
            const history = [...targetTab.history];
            const future = [...targetTab.future.slice(0, HISTORY_LIMIT)]; // Limit future history
            while (history.length > HISTORY_LIMIT) history.shift(); // Limit history

            if (historyMode == "back") {
              future.push(url);
              url = history.pop();
            } else if (historyMode == "forward") {
              history.push(url);
              url = future.pop();
            }
            console.log(history);

            this.$set(this.tabData.tabs, key, {
              key: key,
              url,
              title: "",
              hasEmbed: false,
              history,
              future
            });

            if (this.tabData.tabList.length > this.tabData.sortedTabList.length)
              this.TABS_RESYNC();

            this.TABS_SWITCH_TO(key);
          } else
            console.warning(`Tried to duplicate nonexistent key '${target}'`);
        },

        TABS_SWITCH_TO(key = this.tabData.activeTabKey) {
          this.temp.tabChainIndex = undefined;

          if (this.tabData.tabList.includes(key)) {
            this.tabData.activeTabKey = key;
          }

          this.push_new_history();
          this.saveLocalStorage();
        },

        TABS_CYCLE(amount = 1) {
          let newIndex =
            this.tabData.sortedTabList.indexOf(this.tabData.activeTabKey) +
            amount;
          if (newIndex < 0)
            newIndex = this.tabData.sortedTabList.length + newIndex;
          else if (newIndex >= this.tabData.sortedTabList.length)
            newIndex = newIndex - this.tabData.sortedTabList.length;
          this.TABS_SWITCH_TO(this.tabData.sortedTabList[newIndex]);
        },

        TABS_PUSH_TO_LOADED_LIST(key) {
          if (key) {
            if (!this.temp.loadedTabList.includes(key)) {
              this.temp.loadedTabList.push(key);
              while (this.temp.loadedTabList.length > LOADED_TAB_LIMIT)
                this.temp.loadedTabList.shift();
            } else {
              this.temp.loadedTabList.splice(
                this.temp.loadedTabList.indexOf(key),
                1
              );
              this.temp.loadedTabList.push(key);
            }
          }

          this.saveLocalStorage();
        },

        TABS_CLOSE(key = this.tabData.activeTabKey) {
          if (
            !this.tabData.tabList.includes(key) ||
            this.tabData.tabList.length <= 1
          )
            return;

          if (key === this.tabData.activeTabKey) {
            const activeIndex =
              this.activeTabIndex >= this.tabData.sortedTabList.length - 1
                ? this.tabData.sortedTabList.length - 2
                : this.activeTabIndex + 1;
            this.TABS_SWITCH_TO(this.tabData.sortedTabList[activeIndex]);
          }

          const sortedIndex = this.tabData.sortedTabList.indexOf(key);

          this.tabData.tabList.splice(this.tabData.tabList.indexOf(key), 1);
          this.tabData.sortedTabList.splice(
            this.tabData.sortedTabList.indexOf(key),
            1
          );
          this.temp.loadedTabList.splice(
            this.temp.loadedTabList.indexOf(key),
            1
          );

          this.tabData.closedTabList.push({ key: key, index: sortedIndex });
          while (this.tabData.closedTabList.length > DEAD_TAB_LIMIT) {
            this.tabData.closedTabList.shift();
          }

          const tabsToKeep = [...this.tabData.tabList];
          this.tabData.closedTabList.forEach(closedTab => {
            tabsToKeep.push(closedTab.key);
          });

          const toClear = Object.keys(this.tabData.tabs).filter(
            x => !tabsToKeep.includes(x)
          );

          toClear.forEach(key => {
            if (key in this.tabData.tabs) {
              this.$delete(this.tabData.tabs, key);
            }
          });

          if (this.tabData.tabList.length <= 0) {
            this.TABS_NEW();
          }

          if (this.tabData.tabList.length > this.tabData.sortedTabList.length)
            this.TABS_RESYNC();

          this.saveLocalStorage();
          // Dont remove tab from tab object, so it can be re-opened
        },

        TABS_CLOSE_ON_RIGHT(key = this.tabData.activeTabKey) {
          const hitlist = this.tabData.sortedTabList.slice(
            this.tabData.sortedTabList.indexOf(key) + 1,
            this.tabData.sortedTabList.length
          );
          hitlist.reverse().forEach(key => this.TABS_CLOSE(key));
        },

        TABS_CLOSE_ALL_OTHERS(key = this.tabData.activeTabKey) {
          const hitlist = [...this.tabData.sortedTabList];
          hitlist.splice(this.tabData.sortedTabList.indexOf(key), 1);
          hitlist.reverse().forEach(key => this.TABS_CLOSE(key));
        },

        TABS_RESTORE() {
          if (this.tabData.closedTabList.length > 0) {
            const tab = this.tabData.closedTabList.pop();
            this.tabData.tabList.push(tab.key);
            this.tabData.sortedTabList.splice(tab.index, 0, tab.key);
            this.TABS_SWITCH_TO(tab.key);
          }

          if (this.tabData.tabList.length > this.tabData.sortedTabList.length)
            this.TABS_RESYNC();
        },

        TABS_RESYNC() {
          const lostTabs = this.tabData.tabList.filter(
            key => !this.tabData.sortedTabList.includes(key)
          );
          lostTabs.forEach(key => {
            this.tabData.sortedTabList.push(key);
          });
        },

        TABS_SET_TITLE(key, title) {
          if (!key) {
            console.warn("Can't set title of a tab you haven't sent me");
            return;
          }
          this.tabData.tabs[key].title = title;

          this.saveLocalStorage();
        },

        TABS_SET_HASEMBED(key, hasEmbed) {
          if (!key) {
            console.warn("Can't set hasEmbed of a tab you haven't sent me");
            return;
          }
          this.tabData.tabs[key].hasEmbed = hasEmbed;

          // this.saveLocalStorage()
        },

        TABS_SWAP(key1, key2) {
          this.temp.tabChainIndex = undefined;

          const index1 = this.tabData.sortedTabList.indexOf(key1);
          const index2 = this.tabData.sortedTabList.indexOf(key2);
          if (index1 < 0 || index2 < 0) {
            console.warn(
              `One of the tabs you're trying to swap doesn't exist. Tab 1: ${key1}, Tab 2: ${key2}`
            );
            return;
          }
          this.$set(this.tabData.sortedTabList, index1, key2);
          this.$set(this.tabData.sortedTabList, index2, key1);
        },

        TABS_HISTORY_FORWARD() {
          const tab = this.activeTabObject;
          if (tab.future.length > 0) {
            window.getSelection().empty();
            document.getElementById(tab.key).scrollTop = 0;
            document.getElementById(tab.key).scrollLeft = 0;

            tab.history.push(tab.url);
            tab.url = tab.future.pop();
          }

          this.saveLocalStorage();
        },
        TABS_HISTORY_BACK() {
          const tab = this.activeTabObject;
          if (tab.history.length > 0) {
            window.getSelection().empty();
            document.getElementById(tab.key).scrollTop = 0;
            document.getElementById(tab.key).scrollLeft = 0;

            tab.future.push(tab.url);
            tab.url = tab.history.pop();
          }

          this.saveLocalStorage();
        },

        SAVES_NEW(name, url) {
          let key;
          do {
            key = Math.random()
              .toString(36)
              .substring(2, 5);
          } while (key in this.saveData.saves);
          this.$set(this.saveData.saves, key, { key, name, url });
          this.saveData.saveList.unshift(key);

          this.saveLocalStorage();

          return key;
        },
        SAVES_EDIT(key, name, url) {
          this.saveData.saves[key].name = name;
          this.saveData.saves[key].url = url;

          this.saveLocalStorage();
        },
        SAVES_SWAP(key1, key2) {
          const index1 = this.saveData.saveList.indexOf(key1);
          const index2 = this.saveData.saveList.indexOf(key2);
          if (index1 < 0 || index2 < 0) {
            console.warn(
              `One of the tabs you're trying to swap doesn't exist. Tab 1: ${key1}, Tab 2: ${key2}`
            );
            return;
          }
          this.$set(this.saveData.saveList, index1, key2);
          this.$set(this.saveData.saveList, index2, key1);
        },
        SAVES_DELETE(key) {
          if (key in this.saveData.saves) {
            this.saveData.saveList.splice(
              this.saveData.saveList.indexOf(key),
              1
            );
            this.$delete(this.saveData.saves, key);

            this.saveLocalStorage();
          }
        },
        NEW_READER_SET(current = false, limit = false) {
          if (current) this.settings.newReader.current = current;
          if (limit) this.settings.newReader.limit = limit;

          this.saveLocalStorage();
        },
        NEW_READER_CLEAR() {
          this.settings.newReader.current = false;
          this.settings.newReader.limit = false;

          this.settings.retcon1 = true;
          this.settings.retcon2 = true;
          this.settings.retcon3 = true;
          this.settings.retcon4 = true;
          this.settings.retcon5 = true;
          this.settings.retcon6 = true;

          this.saveLocalStorage();
        },
        SET_ASSET_DIR(path) {
          this.assetDir = path;
          this._saveLocalStorage();
        },
        push_new_history(to) {
          const history_state = {
            tabData: this.tabData
          };
          // console.log("Saving", history_state)
          window.history.pushState(history_state, "", this.activeTabObject.url);
        }
      },
      watch: {
        // 'activeTabObject.url'(to, from) {
        //   if (to != from) {
        //     if (this.temp.isPoppingState) {
        //       // Consume URL change from popped history state (navigation backwards)
        //       console.warn("Not double-counting history navigation", to, from)
        //       this.temp.isPoppingState = false;
        //       return
        //     }
        //   }
        // }
      },
      created() {
        window.addEventListener("popstate", event => {
          // console.log("Loading", event.state)
          this.temp.isPoppingState = true; // next url change should not count as navigation
          if (event?.state?.tabData)
            this.tabData = { ...this.tabData, ...event.state.tabData };
        });
      },
      destroyed() {
        if (this.saveDebounce) {
          this.$logger.info("DESTROYING: flushing debounce");
          this.applySaveIfPending();
        }
      }
    });

    // this.VM.saveLocalStorage()
  }

  get root() {
    return this.VM;
  }

  get assetDir() {
    return this.VM.$data.assetDir;
  }

  get tabData() {
    return this.VM.$data.tabData;
  }

  get saveData() {
    return this.VM.$data.saveData;
  }

  get settings() {
    return this.VM.$data.settings;
  }

  get temp() {
    return this.VM.$data.temp;
  }

  get allHistory() {
    return this.VM.allHistory;
  }
}

export default {
  // Store: LocalData,
  install(Vue, options) {
    const the_store = new LocalData();
    the_store.VM._migrateStorage(window.appVersion);

    // Check for existing session on app start
    const checkSession = (retries = 3) => {
      axios
        .get(`${API_BASE_URL}/session`)
        .then(response => {
          the_store.VM.saveData = response.data.saveData;
          the_store.VM.settings = response.data.settings;
          the_store.VM.isAuthenticated = true; // Set authentication status
          the_store.VM.$logger.info("Session found. Data loaded from server.");
          the_store.VM.reloadLocalStorage(); // Reload local state (tabData, etc.)
        })
        .catch(error => {
          // If unauthorized, clear token
          if (error.response && error.response.status === 401) {
            localStorage.removeItem("jwt_token");
          }
          the_store.VM.$logger.warn(
            "No active session found or failed to load session:",
            error
          );
          if (retries > 0) {
            the_store.VM.$logger.info(
              `Retrying session check (${retries} retries left)...`
            );
            setTimeout(() => checkSession(retries - 1), 1000); // Retry after 1 second
            return;
          }
          // If no session, prompt user to login/signup
          // This will be handled by a new component or a global event
          // For now, we'll just load default data
          the_store.VM.saveData = DEFAULT_SAVEDATA;
          the_store.VM.settings = DEFAULT_SETTINGS;
          the_store.VM.isAuthenticated = false; // Set authentication status
          the_store.VM.reloadLocalStorage(); // Reload local state (tabData, etc.)
        })
        .finally(() => {
          // Set sessionChecked to true in the root Vue instance
          if (window.vm && window.vm.$refs.App) {
            window.vm.$refs.App.sessionChecked = true;
          }
        });
    };

    checkSession();

    Vue.mixin({
      beforeCreate() {
        this.$localData = the_store;
      }
    });
  }
};
