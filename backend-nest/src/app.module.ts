import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';
import { BatchesModule } from './batches/batches.module';
import { SessionsModule } from './sessions/sessions.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ResourcesModule } from './resources/resources.module';
import { QueriesModule } from './queries/queries.module';
import { BatchDoubtsModule } from './batch-doubts/batch-doubts.module';
import { StudentModule } from './student/student.module';
import { ParentModule } from './parent/parent.module';
import { AdminModule } from './admin/admin.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { FeeResetScheduler } from './scheduler/fee-reset.scheduler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    StorageModule,
    UsersModule,
    BatchesModule,
    SessionsModule,
    AttendanceModule,
    ResourcesModule,
    QueriesModule,
    BatchDoubtsModule,
    StudentModule,
    ParentModule,
    AdminModule,
    WebhooksModule,
  ],
  providers: [FeeResetScheduler],
})
export class AppModule {}
