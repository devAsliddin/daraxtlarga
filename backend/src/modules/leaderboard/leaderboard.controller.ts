import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private leaderboard: LeaderboardService) {}

  @Get('global')
  @ApiOperation({ summary: 'Global reyting ro\'yxati' })
  getGlobal(@Query('limit') limit = 50) {
    return this.leaderboard.getGlobalLeaderboard(+limit);
  }

  @Get('region/:region')
  @ApiOperation({ summary: 'Viloyat bo\'yicha reyting' })
  getRegional(@Param('region') region: string, @Query('limit') limit = 20) {
    return this.leaderboard.getRegionalLeaderboard(region, +limit);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mening reytingim' })
  getMyRank(@Req() req: any) {
    return this.leaderboard.getUserRank(req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Platforma statistikasi' })
  getStats() {
    return this.leaderboard.getStats();
  }
}
