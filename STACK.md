# Yashil Quest - Tech Stack

## Project Overview

Yashil Quest - Uzbekistan "Yashil Makon" tashabbusini monitoring qilish uchun gamifikatsiyalangan platforma. Repo local-first development uchun tayyorlangan va Docker talab qilmaydi.

## Architecture Pattern

Monorepo:

- `frontend/` - Next.js PWA
- `backend/` - NestJS API
- `cv-service/` - ixtiyoriy Python CV servis

## Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **State**: Zustand + TanStack Query
- **Map**: Leaflet + react-leaflet
- **Realtime**: socket.io-client
- **PWA**: next-pwa

### Backend

- **Runtime**: Node.js 20+
- **Framework**: NestJS
- **ORM**: Prisma 5
- **Primary DB**: SQLite (`backend/prisma/dev.db`)
- **Cache**: in-memory default, optional Redis
- **Storage**: local `uploads/`, optional MinIO
- **Auth**: JWT + refresh token
- **Realtime**: WebSocket + Socket.io

### AI / CV

- **Ollama**: optional, backend fallback bilan ishlaydi
- **CV Service**: FastAPI
- **Models**: YOLO / MobileNet ishlasa ishlatadi, bo'lmasa mock/fallback

### Blockchain / Tokenomics

- **Approach**: simulated blockchain
- **Immutability**: SHA-256 chained records
- **Wallet**: ed25519 key pair

## Default Ports

| Service | Port |
|---|---|
| Frontend | 3000 |
| Backend API | 3001 |
| CV Service (optional) | 8000 |
| Ollama (optional) | 11434 |

## Default Local Resources

- **DB file**: `backend/prisma/dev.db`
- **Uploaded files**: `uploads/`
- **Environment file**: `.env` va `backend/.env`

## Environment Variables

Asosiy defaultlar:

- `DATABASE_URL=file:./dev.db`
- `REDIS_ENABLED=false`
- `STORAGE_DRIVER=local`
- `UPLOADS_DIR=../uploads`

To'liq ro'yxat uchun `.env.example`ga qarang.
