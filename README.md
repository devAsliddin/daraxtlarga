<div align="center">

# 🌳 Yashil Quest

**O'zbekiston "Yashil Makon" dasturini fuqarolar tomonidan monitoring qilish platformasi**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![NestJS](https://img.shields.io/badge/NestJS-10-e0234e?style=for-the-badge&logo=nestjs)](https://nestjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

*Daraxt ekish bo'yicha davlat hisobotlarini tekshiring, Green Token (GT) ishlang, firibgarlikni fosh qiling.*

[Ishga tushirish](#-tez-ishga-tushirish) · [Arxitektura](#-arxitektura) · [API Docs](#-api-hujjatlari) · [Foydalanish oqimi](#-foydalanish-oqimi)

</div>

---

## 📋 Mundarija

- [Loyiha haqida](#-loyiha-haqida)
- [Asosiy imkoniyatlar](#-asosiy-imkoniyatlar)
- [Tech Stack](#-tech-stack)
- [Arxitektura](#-arxitektura)
- [Ma'lumotlar bazasi sxemasi](#-malumotlar-bazasi-sxemasi)
- [Tez ishga tushirish](#-tez-ishga-tushirish)
- [Muhit o'zgaruvchilari](#-muhit-ozgaruvchilari)
- [Foydalanish oqimi](#-foydalanish-oqimi)
- [Admin panel oqimi](#-admin-panel-oqimi)
- [API hujjatlari](#-api-hujjatlari)
- [Papka tuzilmasi](#-papka-tuzilmasi)

---

## 🌿 Loyiha haqida

**Yashil Quest** — O'zbekistondagi "Yashil Makon" tashabbusi doirasida ekilgan daraxtlarni fuqarolar tomonidan mustaqil tekshirishga imkon beruvchi gamifikatsiyalangan mobil-first veb platforma.

### Muammo

Hukumat hisobotlarida ko'plab joylarda daraxtlar ekilganligi ko'rsatilgan, ammo ularning haqiqatda mavjudligi tekshirilmagan. Bu shaffoflik muammosini keltirib chiqaradi.

### Yechim

Fuqarolar smartfon orqali:
1. Xaritada ekilishi kerak bo'lgan joy topadi
2. O'sha joyga borib rasm oladi
3. Kompyuter ko'rishi (CV) va sun'iy intellekt natijani tahlil qiladi
4. Admin tasdiqlaydi → foydalanuvchi **Green Token (GT)** oladi
5. Firibgarlik aniqlansa, avtomatik hisobot yaratiladi

---

## ✨ Asosiy imkoniyatlar

| Imkoniyat | Tavsif |
|-----------|--------|
| 🗺️ **Interaktiv xarita** | Barcha tekshirilmagan daraxt joylashuvi Leaflet xaritada ko'rsatiladi |
| 📸 **Rasm olish + Liveness** | 3 bosqichli hayotiylik tekshiruvi + 3 tomonlama rasm |
| 🤖 **AI tahlil** | Ollama LLM + CV servis orqali daraxt sog'lig'ini aniqlash |
| ⛓️ **Blockchain yozuv** | SHA-256 zanjirli hashes bilan o'zgarmas tekshiruv yozuvi |
| 🪙 **GT Tokenomics** | Admin tasdiqlaganidan keyin GT coinlar beriladi |
| 🏆 **Gamification** | Darajalar, badge'lar, kundalik vazifalar, leaderboard |
| 🚨 **Fraud Detection** | Avtomatik hisobot + admin panel |
| 👨‍💼 **Admin panel** | To'liq joylashuvlarni boshqarish, tasdiqlash, o'chirish |
| 📱 **PWA** | Offlayn ishlash qobiliyati bilan progressiv veb ilova |

---

## 🛠 Tech Stack

### Frontend
```
Next.js 14 (App Router)    — React framework, SSG/SSR
TailwindCSS                — Utility-first styling
Zustand                    — Global state management
TanStack Query             — Server state + caching
Leaflet + react-leaflet    — Interaktiv xarita
Framer Motion              — Animatsiyalar
next-pwa                   — Progressive Web App
```

### Backend
```
NestJS 10                  — Modular Node.js framework
Prisma 5                   — Type-safe ORM
SQLite                     — Ma'lumotlar bazasi (local dev)
JWT + Refresh Token        — Autentifikatsiya
Socket.io                  — Real-time WebSocket
Swagger / OpenAPI          — API hujjatlari
bcryptjs                   — Parol shifrlash
```

### AI / CV (Ixtiyoriy)
```
Ollama                     — Local LLM (daraxt sog'lig'i tahlili)
FastAPI + Python           — Computer Vision servisi
YOLO / MobileNet           — Daraxt aniqlash modeli
```

### Infratuzilma
```
SHA-256 Blockchain         — Simulated immutable records
ed25519                    — Digital wallet key pairs
AES-256-GCM                — Wallet xususiy kalitlari shifrlash
Local uploads/             — Fayl saqlash (ixtiyoriy MinIO)
In-memory cache            — Rate limiting (ixtiyoriy Redis)
```

---

## 🏗 Arxitektura

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser / PWA                            │
│              Next.js 14  (:3000)                            │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│   │  /map    │ │ /capture │ │  /admin  │ │  /leaderboard│  │
│   └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP REST / WebSocket
                        ▼
┌─────────────────────────────────────────────────────────────┐
│               NestJS API  (:3001/api)                       │
│  ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │   auth    │ │  trees   │ │  admin   │ │   quests     │  │
│  └───────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Prisma ORM                              │   │
│  └───────────────────────┬──────────────────────────────┘   │
└──────────────────────────┼──────────────────────────────────┘
           ┌───────────────┼────────────────┐
           ▼               ▼                ▼
     ┌──────────┐  ┌──────────────┐  ┌──────────────┐
     │  SQLite  │  │  uploads/    │  │  CV Service  │
     │  dev.db  │  │  (rasmlar)   │  │  (:8000)     │
     └──────────┘  └──────────────┘  └──────────────┘
                                           │
                                    ┌──────────────┐
                                    │  Ollama LLM  │
                                    │  (:11434)    │
                                    └──────────────┘
```

---

## 🗄 Ma'lumotlar bazasi sxemasi

```
User ─────────────┬──── TreeVerification ────── TreeLocation
  │               │           │                      │
  │               │           └── GreenToken          │
  │               │                                   │
  ├── UserQuest ──┘                          FraudReport
  ├── UserBadge                                        
  └── RefreshToken

TreeLocation holatlari:
  PENDING   → Tekshirishni kutmoqda (xaritada ko'rinadi)
  DISPUTED  → Munozarali (xaritada ko'rinadi)
  FRAUD     → Firibgarlik (xaritada ko'rinadi)
  VERIFIED  → Tasdiqlangan (xaritadan OLIB TASHLANGAN ✓)
  isDeleted → O'chirilgan (hamma joydan yashirilgan ✓)
```

---

## 🚀 Tez ishga tushirish

### Talablar

- **Node.js** ≥ 20.0.0
- **npm** ≥ 9.0.0
- **Python** 3.10+ *(ixtiyoriy, CV servis uchun)*

### 1. Reponi clone qiling

```bash
git clone https://github.com/devAsliddin/daraxtlarga.git
cd daraxtlarga
```

### 2. Sozlash (birinchi marta)

**Windows (PowerShell):**
```powershell
npm run setup
```

**macOS / Linux:**
```bash
bash scripts/setup.sh
```

> Bu buyruq: `.env` fayllarini yaratadi, barcha bog'liqliklarni o'rnatadi, ma'lumotlar bazasini sozlaydi va dastlabki ma'lumotlarni kiritadi.

### 3. Ishga tushirish

Har birini alohida terminal oynasida:

```bash
# Terminal 1 — Backend
npm run dev:backend

# Terminal 2 — Frontend
npm run dev:frontend
```

### 4. Brauzerda ochish

| Servis | URL |
|--------|-----|
| 🌐 Frontend | http://localhost:3000 |
| ⚙️ Backend API | http://localhost:3001/api |
| 📚 Swagger UI | http://localhost:3001/api/docs |

### 5. Test foydalanuvchi

Seed qilingandan so'ng admin panel uchun:
```
Email:    admin@yashilquest.uz
Parol:    Admin123!
```

---

### Ixtiyoriy: CV servis

```bash
pip install -r cv-service/requirements.txt
npm run dev:cv
# http://localhost:8000 da ishlaydi
```

### Ixtiyoriy: Ollama

```bash
# Ollama o'rnatilgandan so'ng:
ollama pull llama3.2
# Backend avtomatik ulanadi
```

> **Eslatma:** CV servis va Ollama bo'lmasa ham backend fallback rejimida ishlaydi.

---

## 🔧 Muhit o'zgaruvchilari

`backend/.env` fayli:

```env
# Ma'lumotlar bazasi
DATABASE_URL="file:./prisma/dev.db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-secret-change-in-production"
JWT_REFRESH_EXPIRES_IN="7d"

# Fayl saqlash
STORAGE_DRIVER="local"          # local | minio
UPLOADS_DIR="../uploads"

# Cache
REDIS_ENABLED="false"           # true qilsa Redis kerak

# AI servislar (ixtiyoriy)
CV_SERVICE_URL="http://localhost:8000"
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.2"

# Server
PORT=3001
NODE_ENV="development"
CORS_ORIGINS="http://localhost:3000"
```

`frontend/.env.local` fayli:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_WS_URL="http://localhost:3001"
```

---

## 🔄 Foydalanish oqimi

### Asosiy oqim: Daraxt tekshirish

```
1. Ro'yxatdan o'tish / Kirish
         │
         ▼
2. Xaritani ochish (/map)
   • Sariq nuqtalar = Kutilmoqda (PENDING)
   • To'q sariq nuqtalar = Munozarali (DISPUTED)
   • Qizil nuqtalar = Firibgarlik (FRAUD)
         │
         ▼
3. Joylashuvni tanlash
   • 500m radiusda bo'lsangiz → "Tasdiqlash" tugmasi faol
   • Uzoqroq bo'lsangiz → "Yaqinlashing" xabari
         │
         ▼
4. Rasm olish (/capture)
   a. Hayotiylik tekshiruvi (liveness):
      - Ko'zni yumib ochish
      - Chapga qarash
      - O'ngga qarash
      - Kulish
      (3 ta tasodifiy tanlanadi)
   b. Kameradan 1-3 rasm olish
         │
         ▼
5. AI tahlil
   • CV servis: daraxt bormi? nechta?
   • Ollama: sog'lik holati, NDVI
   • Anti-fraud tekshiruv
         │
         ▼
6. Natija
   • Yuborildi → Admin tasdiqlashini kutish
   • DISPUTED → Munozarali, admin tekshiradi
   • FRAUD → Avtomatik hisobot yaratiladi
         │
         ▼
7. Admin tasdiqlaydi → GT Tokenlar beriladi 🪙
```

### Tokenomics

| Harakat | GT miqdori |
|---------|-----------|
| Birinchi tekshiruv | **+10 GT** |
| Monitoring (qayta tekshiruv) | **+5 GT** |
| Vazifa bajarish | **+vazifa mukofoti** |
| *Berilish vaqti* | *Admin tasdiqlagan payt* |

---

## 👨‍💼 Admin panel oqimi

```
/admin sahifasiga kirish (admin huquqi kerak)
         │
         ┌────────────────────────────────┐
         │                                │
         ▼                                ▼
  Yangi joylashuv qo'shish        Joylashuvlarni ko'rish
  ┌─────────────────────┐         ┌────────────────────────┐
  │ • Viloyat tanlash   │         │ ⏳ Kutilmoqda tab:      │
  │ • Xaritadan bosish  │         │  • ✅ Tasdiqlash (GT)   │
  │   (yoki koordinata) │         │  • 🚨 Rad etish         │
  │ • Daraxt turi       │         │  • 🗑 O'chirish          │
  │ • Sana              │         │                        │
  │ • Soni              │         │ ✅ Ko'rib chiqilgan tab:│
  └─────────────────────┘         │  • Qaytarish           │
                                  │  • 🗑 O'chirish          │
                                  └────────────────────────┘
                                           │
                                           │ "✅ Tasdiqlash" bosilsa:
                                           ▼
                                  • Joylashuv VERIFIED holatiga o'tadi
                                  • Xaritadan OLIB TASHLANNADI
                                  • Foydalanuvchiga GT BERILADI
                                  • Leaderboard yangilanadi
```

### Admin imkoniyatlari

| Amal | Natija |
|------|--------|
| ✅ Tasdiqlash (GT berish) | VERIFIED, xaritadan olinadi, GT beriladi |
| 🚨 Rad etish | FRAUD, xaritada qoladi (qizil) |
| ↩️ Qaytarish | DISPUTED ga qaytaradi |
| 🗑 O'chirish | isDeleted=true, hamma joydan yashiriladi |
| ➕ Yangi qo'shish | Xaritadan bosib koordinata tanlash |

---

## 📚 API hujjatlari

Swagger UI: **http://localhost:3001/api/docs**

### Asosiy endpointlar

#### Autentifikatsiya
```http
POST   /api/auth/register       # Ro'yxatdan o'tish
POST   /api/auth/login          # Kirish (JWT + refresh token)
POST   /api/auth/refresh        # Tokenni yangilash
POST   /api/auth/logout         # Chiqish
GET    /api/auth/me             # Joriy foydalanuvchi
```

#### Daraxtlar
```http
GET    /api/trees/map           # Xarita uchun barcha joylashuvlar
GET    /api/trees/:id           # Bir joylashuv detallari
POST   /api/trees/verify        # Tekshiruv yuborish (rasm + GPS)
GET    /api/trees/nearby        # Yaqin atrofdagi daraxtlar
```

#### Admin (🔒 Admin huquqi kerak)
```http
GET    /api/admin/dashboard             # Statistika
GET    /api/admin/tree-locations/review # Kutilmoqda joylashuvlar
GET    /api/admin/tree-locations/reviewed # Ko'rib chiqilganlar
POST   /api/admin/tree-locations        # Yangi joylashuv
PATCH  /api/admin/tree-locations/:id/review  # Tasdiqlash/rad etish
PATCH  /api/admin/tree-locations/:id/reset   # Qaytarish
DELETE /api/admin/tree-locations/:id         # O'chirish (soft delete)
GET    /api/admin/reports/pending       # Kutilgan fraud hisobotlar
PATCH  /api/admin/reports/:id/review    # Hisobot ko'rish
GET    /api/admin/users                 # Foydalanuvchilar ro'yxati
GET    /api/admin/region-report/:region # AI hisoboti
```

#### Gamification
```http
GET    /api/leaderboard         # Reytinglar ro'yxati
GET    /api/quests              # Faol vazifalar
POST   /api/quests/:id/start    # Vazifani boshlash
GET    /api/users/profile       # Profil + tokenlar + badge'lar
```

---

## 📁 Papka tuzilmasi

```
yashil-quest/
├── frontend/                   # Next.js PWA
│   ├── src/
│   │   ├── app/                # App Router sahifalari
│   │   │   ├── map/            # Xarita sahifasi
│   │   │   ├── capture/        # Rasm olish sahifasi
│   │   │   ├── admin/          # Admin panel
│   │   │   ├── auth/           # Login / Register
│   │   │   ├── leaderboard/    # Reyting
│   │   │   ├── profile/        # Profil
│   │   │   └── quests/         # Vazifalar
│   │   ├── components/
│   │   │   ├── map/
│   │   │   │   ├── MapView.tsx        # Asosiy xarita
│   │   │   │   └── LocationPicker.tsx # Admin uchun joy tanlash
│   │   │   └── ui/             # Umumiy UI komponentlar
│   │   ├── store/              # Zustand stores
│   │   ├── hooks/              # Custom React hooks
│   │   └── lib/                # API client, utils
│   └── public/                 # Statik fayllar, PWA icons
│
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # JWT autentifikatsiya
│   │   │   ├── trees/          # Daraxt joylashuvlari + tekshiruv
│   │   │   ├── admin/          # Admin operatsiyalari
│   │   │   ├── leaderboard/    # Reyting
│   │   │   └── quests/         # Gamification
│   │   └── common/
│   │       ├── prisma/         # DB service
│   │       ├── blockchain/     # SHA-256 zanjirli yozuvlar
│   │       ├── ollama/         # AI integratsiya
│   │       ├── minio/          # Fayl saqlash
│   │       └── redis/          # Cache
│   └── prisma/
│       ├── schema.prisma       # DB sxemasi
│       ├── seed.ts             # Dastlabki ma'lumotlar
│       └── dev.db              # SQLite fayli
│
├── cv-service/                 # Python Computer Vision (ixtiyoriy)
│   ├── main.py                 # FastAPI app
│   └── requirements.txt
│
├── scripts/
│   ├── setup.ps1               # Windows setup
│   └── setup.sh                # macOS/Linux setup
│
├── uploads/                    # Yuklangan rasmlar (gitignore)
├── docker-compose.yml          # To'liq Docker stack
└── package.json                # Root scripts
```

---

## 🧩 Asosiy skriptlar

```bash
# Dev rejimi
npm run dev:backend         # Backend ishga tushirish
npm run dev:frontend        # Frontend ishga tushirish
npm run dev:cv              # CV servis ishga tushirish (ixtiyoriy)

# Ma'lumotlar bazasi
npm run db:push             # Sxemani DB ga qo'llash
npm run seed                # Dastlabki ma'lumotlar kiritish
npm run studio              # Prisma Studio (http://localhost:5555)

# Test
npm run test:backend        # Backend testlari
npm run test:frontend       # Frontend testlari

# Build
cd frontend && npm run build   # Production build
```

---

## 🔐 Xavfsizlik

- **JWT** + Refresh Token (httpOnly cookie)
- **Parollar** bcryptjs (salt rounds: 12) bilan shifrlangan
- **Wallet kalitlari** AES-256-GCM bilan shifrlangan
- **GPS tekshiruv** — foydalanuvchi haqiqatan joylashuvda ekanligini tasdiqlash
- **Liveness detection** — soxta foto yuborishning oldini olish
- **Anti-fraud engine** — CV natijasi va davlat hisobotini taqqoslash
- **Blockchain yozuv** — tekshiruv tarixi o'zgartirib bo'lmaydi
- **Rate limiting** — API suiiste'mol qilishdan himoya
- **Admin guard** — Admin endpointlar faqat adminlarga

---

## 📄 Litsenziya

MIT License — batafsil [LICENSE](LICENSE) faylini ko'ring.

---

<div align="center">

**Yashil Quest** — O'zbekistonda ekologik shaffoflik uchun

*Daraxtlar ekilsinmi? Biz tekshiramiz.*

</div>
