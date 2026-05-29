import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, SessionStatus } from '@prisma/client';

@Injectable()
export class ParentService {
  constructor(private prisma: PrismaService) {}

  async linkToStudent(parentClerkId: string, linkCode: string) {
    const parentUser = await this.prisma.user.findUnique({
      where: { clerkId: parentClerkId },
    });
    if (!parentUser) throw new NotFoundException('Parent user not found');
    if (parentUser.role !== Role.PARENT) {
      throw new BadRequestException('Only parent accounts can link to students');
    }

    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { parentLinkCode: linkCode },
      include: { user: true },
    });
    if (!studentProfile) {
      throw new NotFoundException('Invalid link code — ask the student to generate a new one');
    }

    const parentProfile = await this.prisma.parentProfile.findUnique({
      where: { id: parentUser.id },
      include: { linkedStudents: true },
    });
    if (!parentProfile) throw new NotFoundException('Parent profile not found');

    if (parentProfile.linkedStudents.some((s) => s.id === studentProfile.id)) {
      throw new BadRequestException('Already linked to this student');
    }

    await this.prisma.parentProfile.update({
      where: { id: parentUser.id },
      data: { linkedStudents: { connect: { id: studentProfile.id } } },
    });
  }

  async getLinkedStudents(parentClerkId: string) {
    const parentProfile = await this.prisma.parentProfile.findFirst({
      where: { user: { clerkId: parentClerkId } },
      include: {
        linkedStudents: { include: { studentProfile: true } },
      },
    });
    if (!parentProfile) throw new NotFoundException('Parent profile not found');

    return parentProfile.linkedStudents.map((student) => ({
      studentId: student.id,
      studentName: student.fullName,
      email: student.email,
      grade: student.grade,
      blocked: student.blocked,
      feesPaid: student.studentProfile?.feesPaidForCurrentMonth ?? false,
    }));
  }

  async getStudentAttendance(parentClerkId: string, studentId: number, batchId: number) {
    await this.assertParentLinkedToStudent(parentClerkId, studentId);

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

  async getStudentFeeStatus(parentClerkId: string, studentId: number) {
    await this.assertParentLinkedToStudent(parentClerkId, studentId);

    const profile = await this.prisma.studentProfile.findUnique({
      where: { id: studentId },
    });
    if (!profile) throw new NotFoundException('Student profile not found');

    const batches = await this.prisma.batch.findMany({
      where: { students: { some: { id: studentId } } },
    });
    const totalFee = batches.reduce((sum, b) => sum + b.monthlyFee, 0);

    return {
      studentId,
      totalMonthlyFee: totalFee,
      feesPaidForCurrentMonth: profile.feesPaidForCurrentMonth,
    };
  }

  async getStudentBatches(parentClerkId: string, studentId: number) {
    await this.assertParentLinkedToStudent(parentClerkId, studentId);

    const batches = await this.prisma.batch.findMany({
      where: { students: { some: { id: studentId } } },
      include: { teacher: true, students: true, scheduleSlots: true },
    });

    return batches.map((b) => ({
      id: b.id,
      name: b.name,
      grade: b.grade,
      teacherName: b.teacher?.fullName || b.teacher?.email,
      monthlyFee: b.monthlyFee,
      schedule: b.scheduleSlots.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        durationMinutes: s.durationMinutes,
      })),
    }));
  }

  async getStudentSessions(parentClerkId: string, studentId: number) {
    await this.assertParentLinkedToStudent(parentClerkId, studentId);

    const batches = await this.prisma.batch.findMany({
      where: { students: { some: { id: studentId } } },
    });
    const batchIds = batches.map((b) => b.id);
    if (batchIds.length === 0) return [];

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const sessions = await this.prisma.classSession.findMany({
      where: {
        batchId: { in: batchIds },
        status: SessionStatus.SCHEDULED,
        scheduledAt: { gte: twoHoursAgo },
      },
      include: { batch: true },
      orderBy: { scheduledAt: 'asc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      title: s.title,
      scheduledAt: s.scheduledAt,
      batchName: s.batch.name,
      platform: s.platform,
      googleMeetLink: s.googleMeetLink,
    }));
  }

  async assertParentLinkedToStudent(parentClerkId: string, studentId: number) {
    const parentProfile = await this.prisma.parentProfile.findFirst({
      where: { user: { clerkId: parentClerkId } },
      include: { linkedStudents: true },
    });
    if (!parentProfile) throw new NotFoundException('Parent profile not found');

    if (!parentProfile.linkedStudents.some((s) => s.id === studentId)) {
      throw new ForbiddenException('You are not linked to this student');
    }
  }
}
