import { Module } from '@nestjs/common';
import { TreesController } from './trees.controller';
import { TreesService } from './trees.service';
import { AntifraudService } from './antifraud.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  controllers: [TreesController],
  providers: [TreesService, AntifraudService],
  exports: [TreesService],
})
export class TreesModule {}
