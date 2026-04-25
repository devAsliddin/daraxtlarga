import {
  Controller, Get, Post, Param, Body, Query, UseGuards, Req,
  UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TreesService } from './trees.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';

@ApiTags('trees')
@Controller('trees')
export class TreesController {
  constructor(private trees: TreesService) {}

  @Get('map')
  @ApiOperation({ summary: 'Xarita uchun daraxt joylashuvlari' })
  @ApiQuery({ name: 'north', required: false, type: Number })
  @ApiQuery({ name: 'south', required: false, type: Number })
  @ApiQuery({ name: 'east', required: false, type: Number })
  @ApiQuery({ name: 'west', required: false, type: Number })
  getMapLocations(
    @Query('north') north?: number,
    @Query('south') south?: number,
    @Query('east') east?: number,
    @Query('west') west?: number,
  ) {
    const bounds = north && south && east && west ? { north: +north, south: +south, east: +east, west: +west } : undefined;
    return this.trees.getMapLocations(bounds);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Yaqin atrofdagi daraxtlar' })
  @ApiQuery({ name: 'lat', type: Number })
  @ApiQuery({ name: 'lng', type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number })
  getNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number,
  ) {
    return this.trees.getNearbyTrees(+lat, +lng, radius ? +radius : 5);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Daraxtni tasdiqlash (rasm + liveness)' })
  submitVerification(
    @Req() req: any,
    @Body() body: {
      treeLocationId: string;
      photos: string[];
      livenessProof: any;
      gpsLat: number;
      gpsLng: number;
    },
  ) {
    return this.trees.submitVerification(req.user.id, body);
  }

  @Get('user/verifications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Foydalanuvchi tasdiqlashlari tarixi' })
  getUserVerifications(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.trees.getUserVerifications(req.user.id, +page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Daraxt tafsilotlari' })
  getTree(@Param('id') id: string) {
    return this.trees.getTreeById(id);
  }

  @Post('import')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Davlat hisobotidan ma\'lumot yuklash (admin)' })
  importData(@Body() body: { data: any[] }) {
    return this.trees.importStateReportData(body.data);
  }
}
