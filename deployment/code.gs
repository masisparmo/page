// ============================================================================
// GOOGLE APPS SCRIPT CODE
// Copy seluruh kode ini ke dalam file Code.gs di Google Apps Script Editor.
// ============================================================================

const SHEET_ID = ''; // OPTIONAL: Jika script menempel pada sheet, biarkan kosong.

function doGet(e) {
  const data = getAllData();
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

function getAllData() {
  const configRaw = getDataFromSheet('Config');
  const socials = getDataFromSheet('Socials');
  const apps = getDataFromSheet('Apps');

  let config = {};
  configRaw.forEach(item => {
    config[item.Key] = item.Value;
  });

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

function genericCRUD(sheetName, params) {
  const sheet = getSheet(sheetName);
  const operation = params.operation;
  const item = params.item;

  // Ambil headers untuk mapping yang benar
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  if (operation === 'create') {
    // Generate ID Unik
    const newId = (sheetName === 'Socials' ? 'soc_' : 'app_') + new Date().getTime();
    item.ID = newId;

    // Map item values ke urutan header
    const rowValues = headers.map(header => {
      // Handle case mismatch or default empty
      return item[header] !== undefined ? item[header] : "";
    });

    sheet.appendRow(rowValues);
    return { success: true, id: newId };
  }

  if (operation === 'update' || operation === 'delete') {
    const data = sheet.getDataRange().getValues();
    const idIndex = headers.indexOf('ID');
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
      const newRowValues = headers.map(header => {
        return item[header] !== undefined ? item[header] : "";
      });
      sheet.getRange(rowIndex, 1, 1, newRowValues.length).setValues([newRowValues]);
    }
    return { success: true };
  }

  return { success: false, message: "Invalid operation" };
}
