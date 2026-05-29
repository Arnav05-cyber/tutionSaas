import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminInitService } from './admin-init.service';
import { BatchesModule } from '../batches/batches.module';
import { UsersModule } from '../users/users.module';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [BatchesModule, UsersModule],
  controllers: [AdminController],
  providers: [AdminService, AdminInitService, ClerkAuthGuard, RolesGuard],
})
export class AdminModule {}
