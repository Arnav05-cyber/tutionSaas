import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async generateTeacherInvite() {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await this.prisma.teacherInvite.create({
      data: { token, used: false, expiresAt },
    });

    return toInviteResponse(invite, this.config.get('FRONTEND_URL'));
  }

  async getAllInvites() {
    const invites = await this.prisma.teacherInvite.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const frontendUrl = this.config.get('FRONTEND_URL');
    return invites.map((i) => toInviteResponse(i, frontendUrl));
  }

  async getAllFeeStatus() {
    const students = await this.prisma.user.findMany({
      where: { role: Role.STUDENT },
      include: {
        studentProfile: true,
        enrolledBatches: true,
        linkedByParents: { include: { user: true } },
      },
    });

    return students.map((student) => ({
      studentId: student.id,
      studentName: student.fullName,
      email: student.email,
      grade: student.grade,
      studentPhone: student.phoneNumber,
      blocked: student.blocked,
      feesPaid: student.studentProfile?.feesPaidForCurrentMonth ?? false,
      batchNames: student.enrolledBatches.map((b) => b.name),
      parentPhone: student.linkedByParents[0]?.user?.phoneNumber || null,
      parentEmail: student.linkedByParents[0]?.user?.email || null,
    }));
  }

  async blockStudent(studentId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (!user) throw new NotFoundException('Student not found');
    if (user.role !== Role.STUDENT) throw new NotFoundException('Can only block student accounts');

    await this.prisma.user.update({
      where: { id: studentId },
      data: { blocked: true },
    });
  }

  async unblockStudent(studentId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (!user) throw new NotFoundException('Student not found');

    await this.prisma.user.update({
      where: { id: studentId },
      data: { blocked: false },
    });
  }

  async setMonthlyFee(batchId: number, amount: number) {
    if (amount < 0) throw new Error('Fee amount cannot be negative');

    await this.prisma.batch.update({
      where: { id: batchId },
      data: { monthlyFee: amount },
    });
  }

  async getDashboardStats() {
    const [students, teachers, parents, activeBatches] = await Promise.all([
      this.prisma.user.count({ where: { role: Role.STUDENT } }),
      this.prisma.user.count({ where: { role: Role.TEACHER } }),
      this.prisma.user.count({ where: { role: Role.PARENT } }),
      this.prisma.batch.count({ where: { isActive: true } }),
    ]);

    const allStudents = await this.prisma.user.findMany({
      where: { role: Role.STUDENT },
      include: {
        studentProfile: true,
        enrolledBatches: true,
      },
    });

    const unpaidFeesCount = allStudents.filter((s) => {
      if (s.enrolledBatches.length === 0) return false;
      return !s.studentProfile?.feesPaidForCurrentMonth;
    }).length;

    const blockedStudentsCount = allStudents.filter((s) => s.blocked).length;

    return {
      totalStudents: students,
      totalTeachers: teachers,
      totalParents: parents,
      activeBatches,
      unpaidFeesCount,
      blockedStudentsCount,
    };
  }
}

function toInviteResponse(invite: any, frontendUrl: string) {
  return {
    id: invite.id,
    token: invite.token,
    inviteUrl: `${frontendUrl}/sign-up?invite=${invite.token}`,
    used: invite.used,
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
  };
}
