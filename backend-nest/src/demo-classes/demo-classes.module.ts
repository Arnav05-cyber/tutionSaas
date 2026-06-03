import { Module } from '@nestjs/common';
import { DemoClassesController } from './demo-classes.controller';
import { DemoClassesService } from './demo-classes.service';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [DemoClassesController],
  providers: [DemoClassesService, ClerkAuthGuard, RolesGuard],
  exports: [DemoClassesService],
})
export class DemoClassesModule {}
