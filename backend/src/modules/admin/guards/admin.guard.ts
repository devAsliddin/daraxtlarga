import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly adminUserIds: Set<string>;

  constructor(private config: ConfigService) {
    const raw = this.config.get<string>('ADMIN_USER_IDS', '');
    this.adminUserIds = new Set(
      raw.split(',').map(id => id.trim()).filter(Boolean),
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Ruxsat yo\'q');
    }

    if (this.adminUserIds.size > 0 && !this.adminUserIds.has(user.id)) {
      throw new ForbiddenException('Faqat adminlar uchun');
    }

    // If ADMIN_USER_IDS is not set, deny all (fail-safe)
    if (this.adminUserIds.size === 0) {
      throw new ForbiddenException('Admin sozlanmagan');
    }

    return true;
  }
}
