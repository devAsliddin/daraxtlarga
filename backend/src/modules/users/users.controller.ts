import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Profil ma\'lumotlari' })
  getProfile(@Req() req: any) {
    return this.users.getProfile(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Profilni yangilash' })
  updateProfile(@Req() req: any, @Body() body: { region?: string; phone?: string; avatarUrl?: string }) {
    return this.users.updateProfile(req.user.id, body);
  }
}
