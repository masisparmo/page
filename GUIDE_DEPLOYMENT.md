# Panduan Deployment Dashboard

Berikut adalah langkah-langkah untuk mengaktifkan Dashboard Admin dan menghubungkannya dengan Google Sheets.

## 1. Persiapan Google Sheet
1. Buat Google Sheet baru di akun Google Drive Anda.
2. Beri nama Sheet tersebut, misal "Database Website".
3. Buat 4 Tab (Sheet) di dalamnya sesuai dengan struktur yang dijelaskan di file `deployment/database_schema.md`.
   - **Config**: Berisi data profil.
    - **Users**: Berisi username, password, dan email admin.
   - **Socials**: Berisi daftar link sosial media.
   - **Apps**: Berisi daftar aplikasi.
4. Isi data awal sesuai contoh di `deployment/database_schema.md`.

   **TIPS:** Anda juga bisa mendownload file Excel sampel yang sudah saya buatkan di `deployment/isparmo_database_sample.xlsx`.
   - Buka file tersebut di Microsoft Excel / aplikasi spreadsheet lain.
   - Atau langsung Import file tersebut ke Google Sheets (File > Import > Upload).

## 2. Pasang Google Apps Script (Backend)
1. Di Google Sheet tersebut, klik menu **Extensions (Ekstensi)** > **Apps Script**.
2. Hapus kode yang ada di `Code.gs`, lalu copy-paste seluruh kode dari file `deployment/code.gs` yang ada di folder proyek ini.
3. Klik tombol **Save** (ikon disket).

## 3. Deploy Script
1. Klik tombol **Deploy** (kanan atas) > **New deployment**.
2. Klik ikon gerigi (Select type) > **Web app**.
3. Isi form:
   - **Description**: "Backend Website Isparmo" (bebas).
   - **Execute as**: **Me** (alamat email Anda).
   - **Who has access**: **Anyone** (Ini penting agar website bisa mengambil data tanpa login Google user pengunjung).
4. Klik **Deploy**.
5. Salin **Web App URL** yang muncul (Berakhiran `/exec`).

## 4. Hubungkan Website
1. Buka file `js/api.js` di folder website ini.
2. Cari baris:
   ```javascript
   const USE_MOCK = true;
   const GAS_URL = "https://script.google.com/macros/s/AKfycbx_PLACEHOLDER_URL/exec";
   ```
3. Ubah `USE_MOCK` menjadi `false`.
4. Ganti `GAS_URL` dengan URL yang Anda salin tadi.
   ```javascript
   const USE_MOCK = false;
   const GAS_URL = "https://script.google.com/macros/s/AKfycbx_KODERAHASIAANDA/exec";
   ```
5. Simpan file `js/api.js`.

## 5. Selesai!
Sekarang buka `admin.html` di browser.
- Login dengan username/password yang Anda buat di Sheet `Users`.
- Coba edit data profil atau tambah link.
- Refresh halaman utama `index.html`, perubahan seharusnya muncul otomatis.

---
**Catatan Keamanan:**
Sistem ini menggunakan keamanan dasar. URL Web App bersifat publik, namun hanya bisa "diedit" jika mengetahui struktur request POST yang benar (yang ditangani oleh script). Untuk website landing page personal, ini sudah cukup memadai.
