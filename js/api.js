import { MOCK_DATA } from './mock-data.js';

// --- CONFIGURATION ---
const USE_MOCK = false; // Set FALSE jika sudah deploy GAS
const GAS_URL = "https://script.google.com/macros/s/AKfycbzQZd2WX8RkJix13CxjwEmHAMG0iQNAFqilNJi7UY4dddR4yYq-k7YQcyar6Be7fGxhzA/exec";

// --- STATE MANAGEMENT ---
let localData = null; // Menyimpan data yang di-fetch agar tidak request berulang kali jika tidak perlu

// --- API FUNCTIONS ---

export async function fetchData() {
    if (USE_MOCK) {
        console.log("[API] Fetching data (MOCK MODE)...");
        // Simulasi network delay
        await new Promise(r => setTimeout(r, 800));
        localData = JSON.parse(JSON.stringify(MOCK_DATA)); // Deep copy untuk mencegah mutasi langsung
        return localData;
    }

    try {
        // Append Token if available (for Admin Dashboard)
        const token = sessionStorage.getItem('admin_token');
        let url = GAS_URL;
        if (token) {
             const separator = url.includes('?') ? '&' : '?';
             url += `${separator}token=${encodeURIComponent(token)}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        localData = data;
        return data;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

export async function login(username, password) {
    if (USE_MOCK) {
        console.log(`[API] Login attempt: ${username}`);
        await new Promise(r => setTimeout(r, 1000));
        const user = MOCK_DATA.users.find(u => u.Username === username && u.Password === password);
        if (user) return { success: true, token: "mock_token_123" };
        return { success: false, message: "Username atau password salah (MOCK)" };
    }

    return sendPostRequest('login', { username, password });
}

export async function forgotPassword(username) {
    if (USE_MOCK) {
        console.log(`[API] Forgot Password: ${username}`);
        await new Promise(r => setTimeout(r, 1000));
        const user = MOCK_DATA.users.find(u => u.Username === username);
        if (user && user.Email) {
             console.log(`[API] Email sent to ${user.Email}`);
             return { success: true };
        }
        return { success: false, message: "Username tidak ditemukan atau tidak ada email (MOCK)" };
    }
    return sendPostRequest('forgotPassword', { username });
}

export async function updateProfile(profileData) {
    if (USE_MOCK) {
        console.log("[API] Updating profile:", profileData);
        // Update local mock
        Object.keys(profileData).forEach(key => {
            MOCK_DATA.config[key] = profileData[key];
        });
        return { success: true };
    }

    return sendPostRequest('updateProfile', { data: profileData });
}

export async function crudSocial(operation, item) {
    if (USE_MOCK) {
        console.log(`[API] CRUD Social [${operation}]:`, item);
        handleMockCRUD('socials', operation, item);
        return { success: true };
    }
    return sendPostRequest('crudSocial', { operation, item });
}

export async function crudApp(operation, item) {
    if (USE_MOCK) {
        console.log(`[API] CRUD App [${operation}]:`, item);
        handleMockCRUD('apps', operation, item);
        return { success: true };
    }
    return sendPostRequest('crudApp', { operation, item });
}

export async function reorderItems(type, orderedIds) {
    if (USE_MOCK) {
        console.log(`[API] Reorder ${type}:`, orderedIds);
        handleMockReorder(type, orderedIds);
        return { success: true };
    }
    return sendPostRequest('reorderItems', { type, orderedIds });
}

export async function verifyAppPassword(appId, password) {
    if (USE_MOCK) {
        console.log(`[API] Verify App Password: ${appId}`);
        await new Promise(r => setTimeout(r, 500));
        const app = MOCK_DATA.apps.find(a => a.ID === appId);

        if (app && app.Password === password) {
            return { success: true, url: app.Url };
        }
        return { success: false, message: "Password salah (MOCK)" };
    }
    // No token needed for verification as it is public interaction
    return sendPostRequest('verifyAppPassword', { appId, password });
}

// --- HELPER PRIVATE FUNCTIONS ---

async function sendPostRequest(action, payload) {
    // Attach Token if available
    const token = sessionStorage.getItem('admin_token');
    const finalPayload = { action, ...payload };
    if (token) finalPayload.token = token;

    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            // Gunakan default 'cors'. GAS Web App yang diset 'Execute as: Me' dan 'Access: Anyone'
            // akan menghandle CORS dengan benar (biasanya via redirect 302).
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Content-Type simple menghindari preflight OPTIONS
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
    if (operation === 'create') {
        item.ID = `${collectionKey.substring(0,3)}_${new Date().getTime()}`; // Generate ID
        list.push(item);
    } else if (operation === 'update') {
        const index = list.findIndex(x => x.ID === item.ID);
        if (index !== -1) list[index] = item;
    } else if (operation === 'delete') {
        const index = list.findIndex(x => x.ID === item.ID);
        if (index !== -1) list.splice(index, 1);
    }
}

function handleMockReorder(type, orderedIds) {
    const key = type === 'social' ? 'socials' : 'apps';
    const list = MOCK_DATA[key];

    // Sort array based on new order
    list.sort((a, b) => {
        return orderedIds.indexOf(a.ID) - orderedIds.indexOf(b.ID);
    });
}
