import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuestsService } from './quests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('quests')
@Controller('quests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuestsController {
  constructor(private quests: QuestsService) {}

  @Get('active')
  @ApiOperation({ summary: 'Faol vazifalar' })
  getActive(@Req() req: any) {
    return this.quests.getActiveQuests(req.user.id);
  }

  @Get('badges')
  @ApiOperation({ summary: 'Barcha nishonlar' })
  getAllBadges() {
    return this.quests.getAllBadges();
  }

  @Get('my-badges')
  @ApiOperation({ summary: 'Mening nishonlarim' })
  getMyBadges(@Req() req: any) {
    return this.quests.getUserBadges(req.user.id);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Foydalanuvchi profili (statistika)' })
  getProfile(@Req() req: any) {
    return this.quests.getUserProfile(req.user.id);
  }
}
