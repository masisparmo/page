# Struktur Database (Google Sheet)

Buatlah Google Sheet baru dengan 4 Tab (Sheet) berikut. Pastikan nama Tab persis sama (Case Sensitive).

## 1. Sheet: `Config`
Digunakan untuk data profil utama dan pengaturan umum.
**Kolom:** `Key` | `Value`

Isi awal (Contoh):
| Key | Value |
| --- | --- |
| profile_name | ISPARMO |
| profile_title | Trainer AI & Vibe Coder Untuk Produktifitas & Bisnis |
| profile_image | isparmo-foto.png |
| verified_badge | true |
| theme_color | blue |

## 2. Sheet: `Users`
Digunakan untuk login admin.
**Kolom:** `Username` | `Password` | `Email`

Isi awal:
| Username | Password | Email |
| --- | --- | --- |
| admin | 123456 | email_anda@gmail.com |

*(Catatan: Password disimpan plain text untuk kesederhanaan sesuai request, bisa di-hash jika diinginkan nanti)*

## 3. Sheet: `Socials`
Daftar icon sosial media di bawah profil.
**Kolom:** `ID` | `Platform` | `Url` | `IconClass` | `Visible`

Isi awal (Contoh):
| ID | Platform | Url | IconClass | Visible |
| --- | --- | --- | --- | --- |
| soc_1 | Website | https://www.isparmo.com | fas fa-globe | TRUE |
| soc_2 | Email | mailto:mail@isparmo.com | fas fa-envelope | TRUE |
| soc_3 | Facebook | https://www.facebook.com/isparmo.ir/ | fab fa-facebook | TRUE |
| soc_4 | LinkedIn | https://id.linkedin.com/in/ir-isparmo-ipm-489833177 | fab fa-linkedin | TRUE |
| soc_5 | WhatsApp | https://wa.me/628121083060... | fab fa-whatsapp | TRUE |

## 4. Sheet: `Apps`
Daftar aplikasi/link produktivitas (Kartu-kartu link).
**Kolom:** `ID` | `Name` | `Description` | `Url` | `IconClass` | `ColorTheme` | `Visible`

Isi awal (Contoh):
| ID | Name | Description | Url | IconClass | ColorTheme | Visible |
| --- | --- | --- | --- | --- | --- | --- |
| app_1 | Pintar BMC | Buat Business Model Canvas Instan | https://bmcpintar.isparmo.com | fas fa-chart-pie | blue | TRUE |
| app_2 | Pintar Promosi | Generator Copywriting Otomatis | https://pintarpromosi.isparmo.com | fas fa-bullhorn | purple | TRUE |
| app_3 | Pro Studio Foto | Ubah Foto Produk Jadi Luar Biasa | https://gemini.google.com/... | fas fa-camera-retro | pink | TRUE |
