import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [SessionsController],
  providers: [SessionsService, ClerkAuthGuard, RolesGuard],
  exports: [SessionsService],
})
export class SessionsModule {}
