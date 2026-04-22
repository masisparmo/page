// js/mock-data.js
var MOCK_DATA = {
  config: {
    profile_name: "ISPARMO",
    profile_title: "Trainer AI & Vibe Coder Untuk Produktivitas & Bisnis",
    profile_image: "isparmo-foto.webp",
    verified_badge: true,
    theme_color: "blue"
  },
  socials: [
    { ID: "soc_1", Platform: "Website", Url: "https://www.isparmo.com", IconClass: "fas fa-globe", Visible: true },
    { ID: "soc_2", Platform: "Email", Url: "mailto:mail@isparmo.com", IconClass: "fas fa-envelope", Visible: true },
    { ID: "soc_3", Platform: "Facebook", Url: "https://www.facebook.com/isparmo.ir/", IconClass: "fab fa-facebook", Visible: true },
    { ID: "soc_4", Platform: "LinkedIn", Url: "https://id.linkedin.com/in/ir-isparmo-ipm-489833177", IconClass: "fab fa-linkedin", Visible: true },
    { ID: "soc_5", Platform: "WhatsApp", Url: "https://wa.me/628121083060?text=Assalamu'alaikum%20Pak%20Isparmo,%20saya%20mau%20tanya...", IconClass: "fab fa-whatsapp", Visible: true }
  ],
  apps: [
    {
      ID: "app_1",
      Name: "Pintar BMC",
      Description: "Buat Business Model Canvas Instan",
      Url: "https://bmcpintar.isparmo.com",
      IconClass: "fas fa-chart-pie",
      ColorTheme: "blue",
      Visible: true,
      Category: "Bisnis, Produktivitas",
      ClickCount: 120
    },
    {
      ID: "app_2",
      Name: "Pintar Promosi",
      Description: "Generator Copywriting Otomatis",
      Url: "https://pintarpromosi.isparmo.com",
      IconClass: "fas fa-bullhorn",
      ColorTheme: "purple",
      Visible: true,
      Category: "Bisnis",
      ClickCount: 85
    },
    {
      ID: "app_3",
      Name: "Pro Studio Foto",
      Description: "Ubah Foto Produk Jadi Luar Biasa",
      Url: "https://gemini.google.com/share/b4ed682a130a",
      IconClass: "fas fa-camera-retro",
      ColorTheme: "pink",
      Visible: true,
      Category: "Foto",
      ClickCount: 300
    },
    {
      ID: "app_4",
      Name: "Insinyur Website",
      Description: "Buat Website Cepat dengan AI",
      Url: "#",
      IconClass: "fas fa-globe",
      ColorTheme: "slate",
      Visible: true,
      Category: "Website",
      ClickCount: 50,
      Password: "123",
      isLocked: true,
      PasswordSourceUrl: "https://example.com/pass"
    }
  ],
  users: [
    { Username: "admin", Password: "123", Email: "admin@example.com" }
  ]
};

// js/idb.js
var instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);
var idbProxyableTypes;
var cursorAdvanceMethods;
function getIdbProxyableTypes() {
  return idbProxyableTypes || (idbProxyableTypes = [
    IDBDatabase,
    IDBObjectStore,
    IDBIndex,
    IDBCursor,
    IDBTransaction
  ]);
}
function getCursorAdvanceMethods() {
  return cursorAdvanceMethods || (cursorAdvanceMethods = [
    IDBCursor.prototype.advance,
    IDBCursor.prototype.continue,
    IDBCursor.prototype.continuePrimaryKey
  ]);
}
var transactionDoneMap = /* @__PURE__ */ new WeakMap();
var transformCache = /* @__PURE__ */ new WeakMap();
var reverseTransformCache = /* @__PURE__ */ new WeakMap();
function promisifyRequest(request) {
  const promise = new Promise((resolve, reject) => {
    const unlisten = () => {
      request.removeEventListener("success", success);
      request.removeEventListener("error", error);
    };
    const success = () => {
      resolve(wrap(request.result));
      unlisten();
    };
    const error = () => {
      reject(request.error);
      unlisten();
    };
    request.addEventListener("success", success);
    request.addEventListener("error", error);
  });
  reverseTransformCache.set(promise, request);
  return promise;
}
function cacheDonePromiseForTransaction(tx) {
  if (transactionDoneMap.has(tx))
    return;
  const done = new Promise((resolve, reject) => {
    const unlisten = () => {
      tx.removeEventListener("complete", complete);
      tx.removeEventListener("error", error);
      tx.removeEventListener("abort", error);
    };
    const complete = () => {
      resolve();
      unlisten();
    };
    const error = () => {
      reject(tx.error || new DOMException("AbortError", "AbortError"));
      unlisten();
    };
    tx.addEventListener("complete", complete);
    tx.addEventListener("error", error);
    tx.addEventListener("abort", error);
  });
  transactionDoneMap.set(tx, done);
}
var idbProxyTraps = {
  get(target, prop, receiver) {
    if (target instanceof IDBTransaction) {
      if (prop === "done")
        return transactionDoneMap.get(target);
      if (prop === "store") {
        return receiver.objectStoreNames[1] ? void 0 : receiver.objectStore(receiver.objectStoreNames[0]);
      }
    }
    return wrap(target[prop]);
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  },
  has(target, prop) {
    if (target instanceof IDBTransaction && (prop === "done" || prop === "store")) {
      return true;
    }
    return prop in target;
  }
};
function replaceTraps(callback) {
  idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
  if (getCursorAdvanceMethods().includes(func)) {
    return function(...args) {
      func.apply(unwrap(this), args);
      return wrap(this.request);
    };
  }
  return function(...args) {
    return wrap(func.apply(unwrap(this), args));
  };
}
function transformCachableValue(value) {
  if (typeof value === "function")
    return wrapFunction(value);
  if (value instanceof IDBTransaction)
    cacheDonePromiseForTransaction(value);
  if (instanceOfAny(value, getIdbProxyableTypes()))
    return new Proxy(value, idbProxyTraps);
  return value;
}
function wrap(value) {
  if (value instanceof IDBRequest)
    return promisifyRequest(value);
  if (transformCache.has(value))
    return transformCache.get(value);
  const newValue = transformCachableValue(value);
  if (newValue !== value) {
    transformCache.set(value, newValue);
    reverseTransformCache.set(newValue, value);
  }
  return newValue;
}
var unwrap = (value) => reverseTransformCache.get(value);
function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
  const request = indexedDB.open(name, version);
  const openPromise = wrap(request);
  if (upgrade) {
    request.addEventListener("upgradeneeded", (event) => {
      upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
    });
  }
  if (blocked) {
    request.addEventListener("blocked", (event) => blocked(
      // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
      event.oldVersion,
      event.newVersion,
      event
    ));
  }
  openPromise.then((db) => {
    if (terminated)
      db.addEventListener("close", () => terminated());
    if (blocking) {
      db.addEventListener("versionchange", (event) => blocking(event.oldVersion, event.newVersion, event));
    }
  }).catch(() => {
  });
  return openPromise;
}
var readMethods = ["get", "getKey", "getAll", "getAllKeys", "count"];
var writeMethods = ["put", "add", "delete", "clear"];
var cachedMethods = /* @__PURE__ */ new Map();
function getMethod(target, prop) {
  if (!(target instanceof IDBDatabase && !(prop in target) && typeof prop === "string")) {
    return;
  }
  if (cachedMethods.get(prop))
    return cachedMethods.get(prop);
  const targetFuncName = prop.replace(/FromIndex$/, "");
  const useIndex = prop !== targetFuncName;
  const isWrite = writeMethods.includes(targetFuncName);
  if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) || !(isWrite || readMethods.includes(targetFuncName))
  ) {
    return;
  }
  const method = async function(storeName, ...args) {
    const tx = this.transaction(storeName, isWrite ? "readwrite" : "readonly");
    let target2 = tx.store;
    if (useIndex)
      target2 = target2.index(args.shift());
    return (await Promise.all([
      target2[targetFuncName](...args),
      isWrite && tx.done
    ]))[0];
  };
  cachedMethods.set(prop, method);
  return method;
}
replaceTraps((oldTraps) => ({
  ...oldTraps,
  get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
  has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop)
}));
var advanceMethodProps = ["continue", "continuePrimaryKey", "advance"];
var methodMap = {};
var advanceResults = /* @__PURE__ */ new WeakMap();
var ittrProxiedCursorToOriginalProxy = /* @__PURE__ */ new WeakMap();
var cursorIteratorTraps = {
  get(target, prop) {
    if (!advanceMethodProps.includes(prop))
      return target[prop];
    let cachedFunc = methodMap[prop];
    if (!cachedFunc) {
      cachedFunc = methodMap[prop] = function(...args) {
        advanceResults.set(this, ittrProxiedCursorToOriginalProxy.get(this)[prop](...args));
      };
    }
    return cachedFunc;
  }
};
async function* iterate(...args) {
  let cursor = this;
  if (!(cursor instanceof IDBCursor)) {
    cursor = await cursor.openCursor(...args);
  }
  if (!cursor)
    return;
  cursor = cursor;
  const proxiedCursor = new Proxy(cursor, cursorIteratorTraps);
  ittrProxiedCursorToOriginalProxy.set(proxiedCursor, cursor);
  reverseTransformCache.set(proxiedCursor, unwrap(cursor));
  while (cursor) {
    yield proxiedCursor;
    cursor = await (advanceResults.get(proxiedCursor) || cursor.continue());
    advanceResults.delete(proxiedCursor);
  }
}
function isIteratorProp(target, prop) {
  return prop === Symbol.asyncIterator && instanceOfAny(target, [IDBIndex, IDBObjectStore, IDBCursor]) || prop === "iterate" && instanceOfAny(target, [IDBIndex, IDBObjectStore]);
}
replaceTraps((oldTraps) => ({
  ...oldTraps,
  get(target, prop, receiver) {
    if (isIteratorProp(target, prop))
      return iterate;
    return oldTraps.get(target, prop, receiver);
  },
  has(target, prop) {
    return isIteratorProp(target, prop) || oldTraps.has(target, prop);
  }
}));

// js/idb-helper.js
var DB_NAME = "isparmo-cache";
var DB_VERSION = 1;
var STORE_NAME = "api-data";
async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    }
  });
}
async function getCachedData(key) {
  try {
    const db = await initDB();
    return await db.get(STORE_NAME, key);
  } catch (e) {
    console.error("IndexedDB get error:", e);
    return null;
  }
}
async function setCachedData(key, data) {
  try {
    const db = await initDB();
    return await db.put(STORE_NAME, data, key);
  } catch (e) {
    console.error("IndexedDB set error:", e);
  }
}

// js/api.js
var USE_MOCK = false;
var GAS_URL = "https://script.google.com/macros/s/AKfycbzQZd2WX8RkJix13CxjwEmHAMG0iQNAFqilNJi7UY4dddR4yYq-k7YQcyar6Be7fGxhzA/exec";
var localData = null;
async function fetchData(forceRefresh = false) {
  if (USE_MOCK) {
    console.log("[API] Fetching data (MOCK MODE)...");
    await new Promise((r) => setTimeout(r, 800));
    localData = JSON.parse(JSON.stringify(MOCK_DATA));
    return localData;
  }
  const token = sessionStorage.getItem("admin_token");
  if (token) {
    return await fetchDataFromNetwork(token, null);
  }
  const cacheKey = "data_public";
  if (!forceRefresh) {
    const cached = await getCachedData(cacheKey);
    if (cached) {
      localData = cached;
      fetchDataFromNetwork(token, cacheKey).catch(console.error);
      return cached;
    }
  }
  return await fetchDataFromNetwork(token, cacheKey);
}
async function fetchDataFromNetwork(token, cacheKey) {
  try {
    let url = GAS_URL;
    if (token) {
      const separator = url.includes("?") ? "&" : "?";
      url += `${separator}token=${encodeURIComponent(token)}`;
    }
    const response = await fetch(url);
    const data = await response.json();
    if (data && data.config && data.config.profile_image) {
      data.config.profile_image = data.config.profile_image.replace(/\.png$/i, ".webp");
    }
    localData = data;
    if (cacheKey) {
      await setCachedData(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return localData;
  }
}
async function login(username, password) {
  if (USE_MOCK) {
    console.log(`[API] Login attempt: ${username}`);
    await new Promise((r) => setTimeout(r, 1e3));
    const user = MOCK_DATA.users.find((u) => u.Username === username && u.Password === password);
    if (user) return { success: true, token: "mock_token_123" };
    return { success: false, message: "Username atau password salah (MOCK)" };
  }
  return sendPostRequest("login", { username, password });
}
async function forgotPassword(username) {
  if (USE_MOCK) {
    console.log(`[API] Forgot Password: ${username}`);
    await new Promise((r) => setTimeout(r, 1e3));
    const user = MOCK_DATA.users.find((u) => u.Username === username);
    if (user && user.Email) {
      console.log(`[API] Email sent to ${user.Email}`);
      return { success: true };
    }
    return { success: false, message: "Username tidak ditemukan atau tidak ada email (MOCK)" };
  }
  return sendPostRequest("forgotPassword", { username });
}
async function updateProfile(profileData) {
  if (USE_MOCK) {
    console.log("[API] Updating profile:", profileData);
    Object.keys(profileData).forEach((key) => {
      MOCK_DATA.config[key] = profileData[key];
    });
    return { success: true };
  }
  return sendPostRequest("updateProfile", { data: profileData });
}
async function crudSocial(operation, item) {
  if (USE_MOCK) {
    console.log(`[API] CRUD Social [${operation}]:`, item);
    handleMockCRUD("socials", operation, item);
    return { success: true };
  }
  return sendPostRequest("crudSocial", { operation, item });
}
async function crudApp(operation, item) {
  if (USE_MOCK) {
    console.log(`[API] CRUD App [${operation}]:`, item);
    handleMockCRUD("apps", operation, item);
    return { success: true };
  }
  return sendPostRequest("crudApp", { operation, item });
}
async function reorderItems(type, orderedIds) {
  if (USE_MOCK) {
    console.log(`[API] Reorder ${type}:`, orderedIds);
    handleMockReorder(type, orderedIds);
    return { success: true };
  }
  return sendPostRequest("reorderItems", { type, orderedIds });
}
async function incrementAppClick(appId) {
  if (USE_MOCK) {
    console.log(`[API] Increment Click for App: ${appId}`);
    const app = MOCK_DATA.apps.find((a) => a.ID === appId);
    if (app) {
      app.ClickCount = (app.ClickCount || 0) + 1;
      console.log(`[API] New Count for ${app.Name}: ${app.ClickCount}`);
    }
    return { success: true };
  }
  return sendPostRequest("incrementAppClick", { appId });
}
async function verifyAppPassword(appId, password) {
  if (USE_MOCK) {
    console.log(`[API] Verify App Password: ${appId}`);
    await new Promise((r) => setTimeout(r, 500));
    const app = MOCK_DATA.apps.find((a) => a.ID === appId);
    if (app && app.Password === password) {
      return { success: true, url: app.Url };
    }
    return { success: false, message: "Password salah (MOCK)" };
  }
  return sendPostRequest("verifyAppPassword", { appId, password });
}
async function sendPostRequest(action, payload) {
  const token = sessionStorage.getItem("admin_token");
  const finalPayload = { action, ...payload };
  if (token) finalPayload.token = token;
  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      // Gunakan default 'cors'. GAS Web App yang diset 'Execute as: Me' dan 'Access: Anyone'
      // akan menghandle CORS dengan benar (biasanya via redirect 302).
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
        // Content-Type simple menghindari preflight OPTIONS
      },
      body: JSON.stringify(finalPayload)
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error sending POST request:", error);
    return { success: false, message: "Network Error or CORS issue. Pastikan Anda deploy sebagai 'Anyone'." };
  }
}
function handleMockCRUD(collectionKey, operation, item) {
  const list = MOCK_DATA[collectionKey];
  if (operation === "create") {
    item.ID = `${collectionKey.substring(0, 3)}_${(/* @__PURE__ */ new Date()).getTime()}`;
    list.push(item);
  } else if (operation === "update") {
    const index = list.findIndex((x) => x.ID === item.ID);
    if (index !== -1) list[index] = item;
  } else if (operation === "delete") {
    const index = list.findIndex((x) => x.ID === item.ID);
    if (index !== -1) list.splice(index, 1);
  }
}
function handleMockReorder(type, orderedIds) {
  const key = type === "social" ? "socials" : "apps";
  const list = MOCK_DATA[key];
  list.sort((a, b) => {
    return orderedIds.indexOf(a.ID) - orderedIds.indexOf(b.ID);
  });
}
export {
  crudApp,
  crudSocial,
  fetchData,
  forgotPassword,
  incrementAppClick,
  login,
  reorderItems,
  updateProfile,
  verifyAppPassword
};
