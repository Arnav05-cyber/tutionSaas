import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService, ClerkAuthGuard, RolesGuard],
  exports: [AttendanceService],
})
export class AttendanceModule {}
