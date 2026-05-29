import { Module } from '@nestjs/common';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [ResourcesController],
  providers: [ResourcesService, ClerkAuthGuard, RolesGuard],
})
export class ResourcesModule {}
