import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminGuard } from '../guards/admin.guard';

// Regression: ISSUE-001 — Admin endpoints had no role guard; any logged-in user could access /admin/*
// Found by /qa on 2026-04-25
// Report: .gstack/qa-reports/qa-report-yashil-quest-2026-04-25.md

const makeContext = (userId: string) => ({
  switchToHttp: () => ({
    getRequest: () => ({ user: { id: userId } }),
  }),
});

describe('AdminGuard', () => {
  const makeGuard = (adminIds: string) => {
    const config = {
      get: jest.fn().mockImplementation((key: string, def?: string) => {
        if (key === 'ADMIN_USER_IDS') return adminIds;
        return def ?? '';
      }),
    } as unknown as ConfigService;
    return new AdminGuard(config);
  };

  it('allows access for a configured admin user', () => {
    const guard = makeGuard('admin-1,admin-2');
    expect(guard.canActivate(makeContext('admin-1') as any)).toBe(true);
    expect(guard.canActivate(makeContext('admin-2') as any)).toBe(true);
  });

  it('denies access for a non-admin user', () => {
    const guard = makeGuard('admin-1');
    expect(() => guard.canActivate(makeContext('regular-user') as any)).toThrow(ForbiddenException);
  });

  it('denies access when ADMIN_USER_IDS is not configured (fail-safe)', () => {
    const guard = makeGuard('');
    expect(() => guard.canActivate(makeContext('anyone') as any)).toThrow(ForbiddenException);
  });

  it('denies access when user is missing from request', () => {
    const guard = makeGuard('admin-1');
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: null }) }),
    };
    expect(() => guard.canActivate(ctx as any)).toThrow(ForbiddenException);
  });

  it('handles whitespace around admin IDs', () => {
    const guard = makeGuard('  admin-1 , admin-2  ');
    expect(guard.canActivate(makeContext('admin-1') as any)).toBe(true);
  });
});
