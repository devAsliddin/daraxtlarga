# Yashil Quest - Architecture Decisions

## Decision Log

### DEC-001: Blockchain Implementation
**Date**: 2026-04-25  
**Decision**: Real blockchain o'rniga app ichidagi chained SHA-256 record ishlatiladi.  
**Reason**: Hackathon scope uchun oddiyroq, arzonroq va offline/local development bilan mos.

### DEC-002: Computer Vision Service
**Date**: 2026-04-25  
**Decision**: CV logikasi NestJS ichiga emas, alohida Python servisga ajratiladi.  
**Reason**: PyTorch/YOLO Python ekotizimida qulayroq. Shu bilan birga servis optional qoldirildi.

### DEC-003: Map Provider
**Date**: 2026-04-25  
**Decision**: Leaflet + OpenStreetMap ishlatiladi.  
**Reason**: API key kerak emas, tez integratsiya bo'ladi.

### DEC-004: Local-First Development
**Date**: 2026-04-25  
**Decision**: Default development stack Docker'siz ishlaydi.  
**Reason**: Setup soddalashadi, Windows lokal muhitida tezroq ishga tushadi.

### DEC-005: Database Choice
**Date**: 2026-04-25  
**Decision**: Default datasource sifatida SQLite tanlandi.  
**Reason**: Lokal development uchun qo'shimcha servislar kerak bo'lmaydi. Prisma orqali keyinroq PostgreSQL'ga qaytish mumkin.

### DEC-006: Cache / Rate Limit
**Date**: 2026-04-25  
**Decision**: In-memory fallback default, Redis optional.  
**Reason**: Rate limiting va leaderboard infrastructure'siz ham ishlashi kerak.

### DEC-007: File Storage
**Date**: 2026-04-25  
**Decision**: Default storage sifatida lokal `uploads/` ishlatiladi.  
**Reason**: MinIO bo'lmasa ham tree verification oqimi to'xtab qolmaydi.
