import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [UsersController],
  providers: [UsersService, ClerkAuthGuard, RolesGuard],
  exports: [UsersService],
})
export class UsersModule {}
