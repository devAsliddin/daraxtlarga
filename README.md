# Yashil Quest

Bu repo endi Docker'siz ishlaydi.

## Lokal stack

- `backend`: NestJS + Prisma + SQLite
- `frontend`: Next.js
- `storage`: lokal `uploads/`
- `cache / rate limit`: in-memory fallback
- `cv-service`: ixtiyoriy
- `ollama`: ixtiyoriy

## Tez start

### Windows (PowerShell)

```powershell
npm.cmd run setup
npm.cmd run dev:backend
npm.cmd run dev:frontend
```

### macOS / Linux

```bash
bash scripts/setup.sh
npm run dev:backend
npm run dev:frontend
```

Frontend: `http://localhost:3000`  
Backend API: `http://localhost:3001/api`  
Swagger: `http://localhost:3001/api/docs`

## Ixtiyoriy servislar

CV servis kerak bo'lsa:

```bash
python -m pip install -r cv-service/requirements.txt
npm.cmd run dev:cv
```

Ollama bo'lmasa ham backend fallback bilan ishlaydi.

## Muhim defaultlar

- `DATABASE_URL=file:./dev.db`
- `REDIS_ENABLED=false`
- `STORAGE_DRIVER=local`
- rasmlar `uploads/` ichida saqlanadi
# daraxtlarga
