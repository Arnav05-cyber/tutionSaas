import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ClerkId } from '../common/decorators/current-user.decorator';
import { AttendanceService } from './attendance.service';

@Controller()
@UseGuards(ClerkAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('api/sessions/:sessionId/attendance')
  @Roles(Role.TEACHER)
  markAttendance(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() body: any,
    @ClerkId() clerkId: string,
  ) {
    return this.attendanceService.markAttendance(sessionId, body, clerkId);
  }

  @Get('api/sessions/:sessionId/attendance')
  @Roles(Role.TEACHER, Role.ADMIN)
  getAttendance(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.attendanceService.getAttendanceForSession(sessionId);
  }

  @Get('api/batches/:batchId/students/:studentId/attendance')
  @Roles(Role.TEACHER, Role.ADMIN, Role.STUDENT)
  getStudentSummary(
    @Param('batchId', ParseIntPipe) batchId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return this.attendanceService.getStudentAttendanceSummary(batchId, studentId);
  }
}
