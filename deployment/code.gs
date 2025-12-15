// ============================================================================
// GOOGLE APPS SCRIPT CODE
// Copy seluruh kode ini ke dalam file Code.gs di Google Apps Script Editor.
// ============================================================================

const SHEET_ID = ''; // OPTIONAL: Jika script menempel pada sheet, biarkan kosong.

function doGet(e) {
  const token = e.parameter.token;
  const isAdmin = verifyToken(token);
  const data = getAllData(isAdmin);
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;

    // Login does not need token
    if (action === 'login') {
      const result = handleLogin(params);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Forgot Password does not need token
    if (action === 'forgotPassword') {
      const result = handleForgotPassword(params);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // AUTH CHECK FOR WRITE OPERATIONS
    if (!verifyToken(params.token)) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Unauthorized. Invalid Token." }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    let result = { success: false, message: "Unknown action" };
    if (action === 'updateProfile') {
      result = handleUpdateProfile(params);
    } else if (action === 'crudSocial') {
      result = handleCRUDSocial(params);
    } else if (action === 'crudApp') {
      result = handleCRUDApp(params);
    } else if (action === 'reorderItems') {
      result = handleReorderItems(params);
    } else if (action === 'verifyAppPassword') {
      // Public endpoint to verify app password
      result = handleVerifyAppPassword(params);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --- AUTH HELPER ---

function verifyToken(token) {
  if (!token) return false;
  // Simple check: Token must exist in ScriptProperties (created during login)
  const props = PropertiesService.getScriptProperties();
  const storedToken = props.getProperty(token);
  // Check existence and expiration (optional, here just existence for simplicity)
  return storedToken !== null;
}

// --- HELPER FUNCTIONS ---

function getSheet(name) {
  const ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name);
}

function getDataFromSheet(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift();
  return rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function getAllData(isAdmin) {
  const configRaw = getDataFromSheet('Config');
  const socials = getDataFromSheet('Socials');
  let apps = getDataFromSheet('Apps');

  let config = {};
  configRaw.forEach(item => {
    config[item.Key] = item.Value;
  });

  // Security: Hide URL if app is password protected AND user is NOT admin
  if (!isAdmin) {
    apps = apps.map(app => {
      if (app.Password && app.Password.toString().trim() !== "") {
        // Return a modified object without the URL and Password
        const { Url, Password, ...safeApp } = app;
        safeApp.isLocked = true;
        return safeApp;
      }
      return app;
    });
  }

  return {
    config: config,
    socials: socials,
    apps: apps
  };
}

// --- ACTION HANDLERS ---

function handleLogin(params) {
  const users = getDataFromSheet('Users');
  const validUser = users.find(u => u.Username === params.username && u.Password.toString() === params.password.toString());

  if (validUser) {
    const token = "token_" + new Date().getTime() + "_" + Math.random().toString(36).substring(7);
    // Store token in Script Properties
    PropertiesService.getScriptProperties().setProperty(token, params.username);
    return { success: true, token: token };
  } else {
    return { success: false, message: "Username atau Password salah" };
  }
}

function handleForgotPassword(params) {
  const username = params.username;
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const userIdx = headers.indexOf('Username');
  const passIdx = headers.indexOf('Password');
  const emailIdx = headers.indexOf('Email');

  if (userIdx === -1 || emailIdx === -1) {
     return { success: false, message: "Konfigurasi Sheet User salah (Kolom Email tidak ditemukan)" };
  }

  let rowIndex = -1;
  let userEmail = '';

  for (let i = 1; i < data.length; i++) {
    if (data[i][userIdx] === username) {
      rowIndex = i + 1;
      userEmail = data[i][emailIdx];
      break;
    }
  }

  if (rowIndex === -1) return { success: false, message: "Username tidak ditemukan" };
  if (!userEmail) return { success: false, message: "Email belum disetting untuk user ini" };

  // Generate Password Baru
  const newPass = Math.random().toString(36).slice(-8); // 8 character random string

  // Update Password di Sheet
  sheet.getRange(rowIndex, passIdx + 1).setValue(newPass);

  // Kirim Email
  try {
    MailApp.sendEmail({
      to: userEmail,
      subject: "Reset Password Admin Website",
      body: "Halo " + username + ",\n\nPassword admin website Anda telah direset.\n\nPassword Baru: " + newPass + "\n\nSilakan login dan ganti password ini jika perlu.\n\nSalam,\nAdmin System"
    });
    return { success: true };
  } catch (e) {
    return { success: false, message: "Gagal mengirim email: " + e.toString() };
  }
}

function handleUpdateProfile(params) {
  const sheet = getSheet('Config');
  const data = sheet.getDataRange().getValues();

  for (let i = 0; i < data.length; i++) {
    const key = data[i][0];
    if (params.data[key] !== undefined) {
      sheet.getRange(i + 1, 2).setValue(params.data[key]);
    }
  }
  return { success: true };
}

function handleCRUDSocial(params) {
  return genericCRUD('Socials', params);
}

function handleCRUDApp(params) {
  return genericCRUD('Apps', params);
}

function handleVerifyAppPassword(params) {
  const appId = params.appId;
  const password = params.password;

  const apps = getDataFromSheet('Apps');
  const app = apps.find(a => a.ID === appId);

  if (!app) {
    return { success: false, message: "Aplikasi tidak ditemukan" };
  }

  // Check password (case-sensitive)
  if (app.Password && app.Password.toString() === password) {
    return { success: true, url: app.Url };
  } else {
    return { success: false, message: "Password salah" };
  }
}

function handleReorderItems(params) {
  const sheetName = params.type === 'social' ? 'Socials' : 'Apps';
  const orderedIds = params.orderedIds;
  const sheet = getSheet(sheetName);

  if (!sheet) return { success: false, message: "Sheet not found" };

  const data = sheet.getDataRange().getValues();
  const headers = data.shift(); // Remove headers
  const idIndex = headers.indexOf('ID');

  if (idIndex === -1) return { success: false, message: "ID column not found" };

  // Map existing rows by ID
  const rowsMap = new Map();
  data.forEach(row => {
    rowsMap.set(row[idIndex], row);
  });

  // Reconstruct sorted rows
  const newRows = [];

  // 1. Add rows in the specific order requested
  orderedIds.forEach(id => {
    if (rowsMap.has(id)) {
      newRows.push(rowsMap.get(id));
      rowsMap.delete(id);
    }
  });

  // 2. Append any remaining rows (safety fallback if some IDs were missing in the request)
  for (const row of rowsMap.values()) {
    newRows.push(row);
  }

  // Write back to sheet
  if (newRows.length > 0) {
    // Clear old content
    sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn()).clearContent();
    // Write new sorted content
    sheet.getRange(2, 1, newRows.length, newRows[0].length).setValues(newRows);
  }

  return { success: true };
}

function genericCRUD(sheetName, params) {
  const sheet = getSheet(sheetName);
  const operation = params.operation;
  const item = params.item;

  // Ambil headers untuk mapping yang benar
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Normalize headers (trim whitespace) for safer matching
  const cleanHeaders = headers.map(h => h.toString().trim());

  // Function to find value in item ignoring case/whitespace of key
  const getValue = (headerName) => {
    // 1. Try exact match
    if (item[headerName] !== undefined) return item[headerName];

    // 2. Try trimmed match
    const trimmed = headerName.trim();
    if (item[trimmed] !== undefined) return item[trimmed];

    // 3. Try case-insensitive match (slowest but safest)
    const lowerKey = trimmed.toLowerCase();
    const foundKey = Object.keys(item).find(k => k.toLowerCase() === lowerKey);
    if (foundKey) return item[foundKey];

    return "";
  };

  if (operation === 'create') {
    // Generate ID Unik
    const newId = (sheetName === 'Socials' ? 'soc_' : 'app_') + new Date().getTime();
    item.ID = newId;

    // Map item values ke urutan header
    const rowValues = cleanHeaders.map(header => getValue(header));

    sheet.appendRow(rowValues);
    return { success: true, id: newId };
  }

  if (operation === 'update' || operation === 'delete') {
    const data = sheet.getDataRange().getValues();

    // Find ID column index robustly
    const idIndex = cleanHeaders.findIndex(h => h.toLowerCase() === 'id');

    if (idIndex === -1) return { success: false, message: "Column ID not found in sheet" };

    let rowIndex = -1;
    // Cari baris berdasarkan ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] == item.ID) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) return { success: false, message: "ID not found" };

    if (operation === 'delete') {
      sheet.deleteRow(rowIndex);
    } else {
      // Update: Map values to columns
      const newRowValues = cleanHeaders.map(header => getValue(header));

      sheet.getRange(rowIndex, 1, 1, newRowValues.length).setValues([newRowValues]);
    }
    return { success: true };
  }

  return { success: false, message: "Invalid operation" };
}
