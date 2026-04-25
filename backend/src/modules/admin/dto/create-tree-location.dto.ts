import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const TREE_STATUSES = ['PENDING', 'VERIFIED', 'DISPUTED', 'FRAUD'] as const;

export class CreateTreeLocationDto {
  @ApiProperty({ example: 41.2995 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: 69.2401 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiProperty({ example: 50 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  stateReportedCount: number;

  @ApiProperty({ example: 'Toshkent' })
  @IsString()
  region: string;

  @ApiPropertyOptional({ example: 'Chilonzor' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: 'Chinor' })
  @IsOptional()
  @IsString()
  species?: string;

  @ApiPropertyOptional({ example: '2026-04-25' })
  @IsOptional()
  @IsDateString()
  plantationDate?: string;

  @ApiPropertyOptional({ example: 'PENDING', enum: TREE_STATUSES })
  @IsOptional()
  @IsIn(TREE_STATUSES)
  status?: (typeof TREE_STATUSES)[number];
}
