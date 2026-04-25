import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Post('fraud')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Firibgarlik hisobotini yuborish' })
  createReport(
    @Req() req: any,
    @Body() body: {
      treeLocationId: string;
      description: string;
      photos?: string[];
      gpsLat: number;
      gpsLng: number;
    },
  ) {
    return this.reports.createFraudReport(req.user.id, body);
  }

  @Get()
  @ApiOperation({ summary: 'Barcha hisobotlar' })
  getReports(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    return this.reports.getReports(+page, +limit, status);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mening hisobotlarim' })
  getMyReports(@Req() req: any) {
    return this.reports.getUserReports(req.user.id);
  }
}
