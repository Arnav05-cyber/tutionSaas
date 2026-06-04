import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async markAttendance(
    sessionId: number,
    dto: { entries: { studentId: number; present: boolean }[] },
    clerkId: string,
  ) {
    const session = await this.prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { batch: { include: { teacher: true } } },
    });
    if (!session) throw new NotFoundException('Session not found');

    const teacher = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    if (session.batch.teacher.id !== teacher.id) {
      throw new ForbiddenException('You can only mark attendance for your own sessions');
    }

    for (const entry of dto.entries) {
      await this.prisma.attendanceRecord.upsert({
        where: { sessionId_studentId: { sessionId, studentId: entry.studentId } },
        update: { present: entry.present, markedAt: new Date() },
        create: { sessionId, studentId: entry.studentId, present: entry.present },
      });
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where: { sessionId },
      include: { student: true },
    });

    return toAttendanceResponse(session, records);
  }

  async getAttendanceForSession(sessionId: number) {
    const session = await this.prisma.classSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');

    const records = await this.prisma.attendanceRecord.findMany({
      where: { sessionId },
      include: { student: true },
    });

    return toAttendanceResponse(session, records);
  }

  async getStudentAttendanceSummary(
    batchId: number,
    studentId: number,
    requestingUser: any,
    clerkId: string,
  ) {
    if (requestingUser.role === Role.STUDENT) {
      if (requestingUser.id !== studentId) {
        throw new ForbiddenException('You can only view your own attendance');
      }
    } else if (requestingUser.role === Role.TEACHER) {
      const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
      if (!batch) throw new NotFoundException('Batch not found');
      const teacher = await this.prisma.user.findUnique({ where: { clerkId } });
      if (!teacher || batch.teacherId !== teacher.id) {
        throw new ForbiddenException('You can only view attendance for your own batches');
      }
    }

    const total = await this.prisma.attendanceRecord.count({
      where: { studentId, session: { batchId } },
    });
    const attended = await this.prisma.attendanceRecord.count({
      where: { studentId, present: true, session: { batchId } },
    });

    return {
      totalSessions: total,
      attendedSessions: attended,
      percentage: total > 0 ? (attended / total) * 100 : 0,
    };
  }
}

function toAttendanceResponse(session: any, records: any[]) {
  return {
    sessionId: session.id,
    sessionTitle: session.title,
    entries: records.map((r) => ({
      studentId: r.studentId,
      studentName: r.student?.fullName || r.student?.email,
      present: r.present,
      markedAt: r.markedAt,
    })),
  };
}
