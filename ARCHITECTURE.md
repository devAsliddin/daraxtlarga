# Yashil Quest - System Architecture

## High-Level Architecture

```text
Browser / PWA (Next.js, :3000)
        |
        | HTTP / WebSocket
        v
NestJS API (backend, :3001)
        |
        +--> SQLite via Prisma (local file)
        +--> uploads/ static file storage
        +--> in-memory cache / rate limiter
        +--> optional CV service (:8000)
        +--> optional Ollama (:11434)
```

## Runtime Model

Lokal development uchun majburiy qismlar:

- `frontend`
- `backend`
- `SQLite` fayli

Ixtiyoriy qismlar:

- `cv-service`
- `Ollama`
- `Redis`
- `MinIO`

Backend bu servislar ishlamasa fallback bilan davom etadi.

## Persistence

### Main Database

- Prisma datasource: SQLite
- Fayl: `backend/prisma/dev.db`
- Schema push: `npm run db:push`
- Seed: `npm run seed`

### Uploaded Files

- Default saqlash joyi: root `uploads/`
- Backend ularni `/uploads/*` orqali servis qiladi
- Istalsa `STORAGE_DRIVER=minio` bilan MinIO'ga qaytarish mumkin

## Core Modules

- `auth` - login, register, refresh token
- `trees` - daraxt joylashuvlari va verifikatsiya
- `leaderboard` - reytinglar
- `quests` - gamification
- `reports` - fraud reportlar
- `admin` - admin statistikasi

## Verification Flow

```text
Photo capture
  -> local upload save
  -> optional CV analyze
  -> optional Ollama analysis
  -> anti-fraud checks
  -> blockchain-like hash record
  -> token award
  -> leaderboard update
```

## Data Notes

- `photos` URL ko'rinishida saqlanadi
- `cvResult`, `livenessProof`, `evidence`, `progress` JSON sifatida saqlanadi
- leaderboard default holatda DB + memory orqali ishlaydi
