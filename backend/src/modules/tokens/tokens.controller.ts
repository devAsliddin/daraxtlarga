import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TokensService } from './tokens.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('tokens')
@Controller('tokens')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TokensController {
  constructor(private tokens: TokensService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Mening Green Token balansim' })
  getBalance(@Req() req: any) {
    return this.tokens.getUserBalance(req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Token tranzaksiyalar tarixi' })
  getHistory(@Req() req: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.tokens.getTransactionHistory(req.user.id, +page, +limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Token muomalasi statistikasi' })
  getStats() {
    return this.tokens.getTokenSupplyStats();
  }

  @Get('verify-chain')
  @ApiOperation({ summary: 'Blockchain zanjir tekshirish' })
  verifyChain(@Req() req: any) {
    return this.tokens.verifyBlockchainIntegrity(req.user.id);
  }
}
