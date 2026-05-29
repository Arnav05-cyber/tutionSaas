import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [StudentController],
  providers: [ClerkAuthGuard, RolesGuard],
})
export class StudentModule {}
