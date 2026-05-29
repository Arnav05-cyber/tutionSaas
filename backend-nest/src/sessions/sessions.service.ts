import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, SessionStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async createSession(
    batchId: number,
    dto: {
      title?: string;
      scheduledAt: string;
      durationMinutes?: number;
      googleMeetLink?: string;
      platform?: string;
    },
    clerkId: string,
  ) {
    const scheduledAt = new Date(dto.scheduledAt);
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (scheduledAt < fifteenMinutesAgo) {
      throw new BadRequestException('Cannot schedule a session in the past');
    }

    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: { teacher: true },
    });
    if (!batch) throw new NotFoundException('Batch not found');
    await this.validateTeacherOwnsBatch(batch, clerkId);

    const platform = dto.platform || 'EXTERNAL';
    const internalRoomId = platform === 'INTERNAL' ? `EDUSHA-Live-${uuidv4()}` : null;

    const session = await this.prisma.classSession.create({
      data: {
        batchId,
        title: dto.title || null,
        scheduledAt,
        durationMinutes: dto.durationMinutes || 60,
        googleMeetLink: dto.googleMeetLink || null,
        platform,
        internalRoomId,
      },
      include: { batch: true },
    });

    return toSessionResponse(session);
  }

  async updateSession(
    sessionId: number,
    dto: {
      title?: string;
      scheduledAt?: string;
      durationMinutes?: number;
      googleMeetLink?: string;
      platform?: string;
    },
    clerkId: string,
  ) {
    if (dto.scheduledAt) {
      const scheduledAt = new Date(dto.scheduledAt);
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (scheduledAt < fifteenMinutesAgo) {
        throw new BadRequestException('Cannot reschedule a session to the past');
      }
    }

    const session = await this.prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { batch: { include: { teacher: true } } },
    });
    if (!session) throw new NotFoundException('Session not found');
    await this.validateTeacherOwnsBatch(session.batch, clerkId);

    if (session.status !== SessionStatus.SCHEDULED) {
      throw new BadRequestException('Can only update scheduled sessions');
    }

    const updated = await this.prisma.classSession.update({
      where: { id: sessionId },
      data: {
        title: dto.title !== undefined ? dto.title : session.title,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : session.scheduledAt,
        durationMinutes: dto.durationMinutes || session.durationMinutes,
        googleMeetLink: dto.googleMeetLink !== undefined ? dto.googleMeetLink : session.googleMeetLink,
        platform: dto.platform || session.platform,
      },
      include: { batch: true },
    });

    return toSessionResponse(updated);
  }

  async cancelSession(sessionId: number, clerkId: string) {
    const session = await this.prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { batch: { include: { teacher: true } } },
    });
    if (!session) throw new NotFoundException('Session not found');
    await this.validateTeacherOwnsBatch(session.batch, clerkId);

    if (session.status !== SessionStatus.SCHEDULED) {
      throw new BadRequestException('Can only cancel scheduled sessions');
    }

    const updated = await this.prisma.classSession.update({
      where: { id: sessionId },
      data: { status: SessionStatus.CANCELLED },
      include: { batch: true },
    });
    return toSessionResponse(updated);
  }

  async completeSession(sessionId: number, clerkId: string) {
    const session = await this.prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { batch: { include: { teacher: true } } },
    });
    if (!session) throw new NotFoundException('Session not found');
    await this.validateTeacherOwnsBatch(session.batch, clerkId);

    if (session.status !== SessionStatus.SCHEDULED) {
      throw new BadRequestException('Can only complete scheduled sessions');
    }

    const updated = await this.prisma.classSession.update({
      where: { id: sessionId },
      data: { status: SessionStatus.COMPLETED },
      include: { batch: true },
    });
    return toSessionResponse(updated);
  }

  async deleteSession(sessionId: number, clerkId: string) {
    const session = await this.prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { batch: { include: { teacher: true } } },
    });
    if (!session) throw new NotFoundException('Session not found');
    await this.validateTeacherOwnsBatch(session.batch, clerkId);

    await this.prisma.sessionJoinLog.deleteMany({ where: { sessionId } });
    await this.prisma.attendanceRecord.deleteMany({ where: { sessionId } });
    await this.prisma.classSession.delete({ where: { id: sessionId } });
  }

  async getSessionsForBatch(batchId: number) {
    const sessions = await this.prisma.classSession.findMany({
      where: { batchId },
      include: { batch: true },
      orderBy: { scheduledAt: 'desc' },
    });
    return sessions.map(toSessionResponse);
  }

  async getSessionById(sessionId: number) {
    const session = await this.prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { batch: true },
    });
    if (!session) throw new NotFoundException('Session not found');
    return toSessionResponse(session);
  }

  async getUpcomingSessionsForStudent(clerkId: string) {
    const student = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!student) throw new NotFoundException('Student not found');

    const batches = await this.prisma.batch.findMany({
      where: { students: { some: { id: student.id } } },
    });
    const batchIds = batches.map((b) => b.id);
    if (batchIds.length === 0) return [];

    const sessions = await this.prisma.classSession.findMany({
      where: {
        batchId: { in: batchIds },
        status: SessionStatus.SCHEDULED,
        scheduledAt: { gte: new Date() },
      },
      include: { batch: true },
      orderBy: { scheduledAt: 'asc' },
    });
    return sessions.map(toSessionResponse);
  }

  async logStudentJoin(sessionId: number, clerkId: string) {
    const session = await this.prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { batch: true },
    });
    if (!session) throw new NotFoundException('Session not found');

    const student = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!student) throw new NotFoundException('Student not found');

    const enrolled = await this.prisma.batch.findFirst({
      where: { id: session.batchId, students: { some: { id: student.id } } },
    });
    if (!enrolled) throw new ForbiddenException('You are not enrolled in this batch');

    const alreadyLogged = await this.prisma.sessionJoinLog.findUnique({
      where: { sessionId_studentId: { sessionId, studentId: student.id } },
    });

    if (!alreadyLogged) {
      await this.prisma.sessionJoinLog.create({
        data: { sessionId, studentId: student.id },
      });
    }

    if (
      session.platform === 'EXTERNAL' &&
      (!session.googleMeetLink || !session.googleMeetLink.trim())
    ) {
      throw new BadRequestException('No meeting link has been set for this session yet');
    }

    return toSessionResponse(session);
  }

  async getJoinLogs(sessionId: number, clerkId: string) {
    const session = await this.prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { batch: { include: { teacher: true } } },
    });
    if (!session) throw new NotFoundException('Session not found');
    await this.validateTeacherOwnsBatch(session.batch, clerkId);

    const logs = await this.prisma.sessionJoinLog.findMany({
      where: { sessionId },
      include: { student: true },
    });

    return logs.map((log) => ({
      studentId: log.student.id,
      studentName: log.student.fullName,
      joinedAt: log.joinedAt,
    }));
  }

  private async validateTeacherOwnsBatch(batch: any, clerkId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === Role.ADMIN) return;
    if (!batch.teacher || batch.teacher.id !== user.id) {
      throw new ForbiddenException('You can only manage sessions for your own batches');
    }
  }
}

function toSessionResponse(session: any) {
  const endTime = new Date(session.scheduledAt);
  endTime.setMinutes(endTime.getMinutes() + (session.durationMinutes || 60));

  return {
    id: session.id,
    title: session.title,
    scheduledAt: session.scheduledAt,
    endTime,
    durationMinutes: session.durationMinutes,
    googleMeetLink: session.googleMeetLink,
    status: session.status,
    batchName: session.batch?.name || '',
    batchId: session.batchId,
    platform: session.platform,
    internalRoomId: session.internalRoomId,
  };
}
