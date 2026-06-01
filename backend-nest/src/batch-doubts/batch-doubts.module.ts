import { Module } from '@nestjs/common';
import { BatchDoubtsController } from './batch-doubts.controller';
import { BatchDoubtsService } from './batch-doubts.service';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [BatchDoubtsController],
  providers: [BatchDoubtsService, ClerkAuthGuard, RolesGuard],
})
export class BatchDoubtsModule {}
