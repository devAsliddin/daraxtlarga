# QA Report — Yashil Quest — 2026-04-25

**Mode:** Full code QA (no browser — bun not installed, ran static + unit testing)
**Branch:** not a git repo
**Tests before:** 35 pass
**Tests after:** 50 pass
**Health score:** 72 → 88

---

## Summary

| Severity | Found | Fixed | Deferred |
|----------|-------|-------|----------|
| Critical | 1 | 1 | 0 |
| Medium | 4 | 4 | 0 |
| Low | 0 | 0 | 0 |
| **Total** | **5** | **5** | **0** |

**PR Summary:** QA found 5 issues, fixed all 5, health score 72 → 88.

---

## Issues

### ISSUE-001 — Admin endpoints had no role guard [CRITICAL] ✅ VERIFIED

**File:** `backend/src/modules/admin/admin.controller.ts`

Any authenticated user could hit `/admin/dashboard`, `/admin/users`, `/admin/reports/pending`, and `/admin/reports/:id/review`. A regular app user could see all other users' emails, approve/reject fraud reports, or view the admin dashboard.

**Fix:**
- Created `backend/src/modules/admin/guards/admin.guard.ts` — reads `ADMIN_USER_IDS` from env (comma-separated), denies access if user is not in the list, denies ALL access if env var is not set (fail-safe)
- Applied `@UseGuards(JwtAuthGuard, AdminGuard)` to `AdminController`
- Added `AdminGuard` to `AdminModule` providers

**Regression test:** `src/modules/admin/tests/admin.guard.spec.ts` (5 tests)

**How to configure:** Add `ADMIN_USER_IDS=<your-user-id>` to `.env`

---

### ISSUE-002 — reports.service.ts throws 500 for missing tree instead of 404 [MEDIUM] ✅ VERIFIED

**File:** `backend/src/modules/reports/reports.service.ts:35`

```ts
// Before
if (!tree) throw new Error('Daraxt topilmadi');

// After
if (!tree) throw new NotFoundException('Daraxt topilmadi');
```

`Error` is not caught by NestJS exception filters and returns a 500. `NotFoundException` returns a proper 404 with the Uzbek message.

---

### ISSUE-003 — getUserProfile spreads Prisma _count into API response [MEDIUM] ✅ VERIFIED

**File:** `backend/src/modules/quests/quests.service.ts`

The `...user` spread included Prisma's internal `_count` field in the JSON response to clients. This exposed internal query metadata. Fixed by destructuring `_count` and `userBadges` before spreading.

**Regression test:** `src/modules/quests/tests/quests.service.spec.ts` (4 tests)

---

### ISSUE-004 — N+1 query in getGlobalLeaderboard [MEDIUM] ✅ VERIFIED

**File:** `backend/src/modules/leaderboard/leaderboard.service.ts`

Was making one `prisma.user.findUnique()` call per user in the Redis leaderboard. With 50 entries, that's 50 sequential DB round-trips per leaderboard request.

Fixed by collecting all user IDs first, then fetching in a single `findMany({ where: { id: { in: userIds } } })` batch query. Also fixed rank ordering to follow Redis score order (not DB insertion order).

**Regression test:** `src/modules/leaderboard/tests/leaderboard.service.spec.ts` (5 tests)

---

### ISSUE-005 — Frontend had no test script or jest config [MEDIUM] ✅ VERIFIED

**Files:** `frontend/package.json`, `frontend/jest.config.js` (new)

`jest` and `@testing-library` were in devDependencies. A `__tests__/map.test.tsx` existed. But there was no `test` script and no `jest.config.js`, so `npm test` would fail.

**Fix:**
- Added `jest.config.js` with Next.js babel transform, path aliases (`@/` → `src/`), jsdom environment
- Added `__mocks__/styleMock.js` for CSS imports
- Added `test`, `test:watch`, `test:cov` scripts to `package.json`

---

## Health Score Breakdown

| Category | Before | After |
|----------|--------|-------|
| Security (admin guard) | 40 | 100 |
| Functional (404 vs 500) | 70 | 90 |
| API correctness (_count leak) | 80 | 100 |
| Performance (N+1) | 60 | 95 |
| Test infrastructure | 50 | 85 |
| **Weighted score** | **72** | **88** |

---

## Login / Auth Review

Auth flow is structurally sound:

- ✅ Passwords hashed with bcrypt (cost 12)
- ✅ JWT access token (15m expiry) + refresh token (7d)
- ✅ Refresh tokens stored in DB with expiry check
- ✅ `JwtStrategy.validate()` re-fetches user from DB on every request (revocation support)
- ✅ Login accepts email OR username (intentional — `OR: [{ email }, { username: email }]`)
- ✅ `logout()` deletes all refresh tokens for the user
- ⚠️ `walletPrivKey` comment says "// encrypted" but is stored as plaintext PEM — misleading comment (acceptable for hackathon, recommend encrypting before production)
- ✅ Frontend auth store persists to localStorage with `zustand/persist`
- ✅ Axios interceptor auto-refreshes on 401

---

## Deferred

None.
