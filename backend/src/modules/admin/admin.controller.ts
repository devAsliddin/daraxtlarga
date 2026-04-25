import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { CreateTreeLocationDto } from './dto/create-tree-location.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Admin boshqaruv paneli statistikasi' })
  getDashboard() {
    return this.admin.getDashboardStats();
  }

  @Get('reports/pending')
  @ApiOperation({ summary: 'Kutilayotgan hisobotlar' })
  getPendingReports(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.admin.getPendingReports(+page, +limit);
  }

  @Patch('reports/:id/review')
  @ApiOperation({ summary: 'Hisobotni ko\'rib chiqish' })
  reviewReport(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { action: 'CONFIRMED' | 'REJECTED'; notes?: string },
  ) {
    return this.admin.reviewReport(id, req.user.id, body.action, body.notes);
  }

  @Get('users')
  @ApiOperation({ summary: 'Barcha foydalanuvchilar' })
  getUsers(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.admin.getAllUsers(+page, +limit);
  }

  @Get('region-report/:region')
  @ApiOperation({ summary: 'Viloyat hisoboti (AI yordamida)' })
  getRegionReport(@Param('region') region: string) {
    return this.admin.generateRegionReport(decodeURIComponent(region));
  }

  @Get('ollama-status')
  @ApiOperation({ summary: 'Ollama holati' })
  getOllamaStatus() {
    return this.admin.getOllamaStatus();
  }

  @Post('tree-locations')
  @ApiOperation({ summary: 'Yangi daraxt joylashuvini qo`shish' })
  createTreeLocation(@Req() req: any, @Body() body: CreateTreeLocationDto) {
    return this.admin.createTreeLocation(req.user.id, body);
  }

  @Get('tree-locations/review')
  @ApiOperation({ summary: 'Tekshirishni kutayotgan joylashuvlar (PENDING/DISPUTED)' })
  getTreeLocationsForReview(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.admin.getTreeLocationsForReview(+page, +limit);
  }

  @Get('tree-locations/reviewed')
  @ApiOperation({ summary: 'Ko\'rib chiqilgan joylashuvlar (VERIFIED/FRAUD)' })
  getReviewedLocations(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.admin.getReviewedLocations(+page, +limit);
  }

  @Patch('tree-locations/:id/review')
  @ApiOperation({ summary: 'Joylashuvni tekshirish: bu haqiqiy daraxtmi yoki yo`q' })
  reviewTreeLocation(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { action: 'VERIFIED' | 'FRAUD'; notes?: string },
  ) {
    return this.admin.reviewTreeLocation(id, req.user.id, body.action, body.notes);
  }

  @Patch('tree-locations/:id/reset')
  @ApiOperation({ summary: 'Joylashuvni qayta ko\'rib chiqishga qaytarish' })
  resetTreeLocation(@Param('id') id: string) {
    return this.admin.resetTreeLocation(id);
  }
}
