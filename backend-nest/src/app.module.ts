import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
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
import { DemoClassesModule } from './demo-classes/demo-classes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000,
        limit: 120,
      },
    ]),
    PrismaModule,
    AuditModule,
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
    DemoClassesModule,
  ],
  providers: [
    FeeResetScheduler,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
