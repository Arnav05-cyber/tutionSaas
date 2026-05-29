import { Module } from '@nestjs/common';
import { BatchesController } from './batches.controller';
import { BatchesService } from './batches.service';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [BatchesController],
  providers: [BatchesService, ClerkAuthGuard, RolesGuard],
  exports: [BatchesService],
})
export class BatchesModule {}
