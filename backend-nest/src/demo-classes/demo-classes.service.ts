import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DemoClassStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

const VALID_GRADES = ['9', '10', '11', '12'];

@Injectable()
export class DemoClassesService {
  constructor(private prisma: PrismaService) {}

  // ─── Public (no auth) ────────────────────────────────────────────────────

  async getPublicDemoClass() {
    const enabled = await this.isFeatureEnabled();
    if (!enabled) return null;

    const demoClass = await this.prisma.demoClass.findFirst({
      where: {
        status: DemoClassStatus.SCHEDULED,
        scheduledAt: { gte: new Date() },
      },
      include: { enrollments: true },
      orderBy: { scheduledAt: 'asc' },
    });

    if (!demoClass) return null;

    return {
      id: demoClass.id,
      title: demoClass.title,
      grade: demoClass.grade,
      scheduledAt: demoClass.scheduledAt,
      capacity: demoClass.capacity,
      enrolledCount: demoClass.enrollments.length,
    };
  }

  // ─── Feature toggle ───────────────────────────────────────────────────────

  async isFeatureEnabled(): Promise<boolean> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key: 'demo_class_enabled' },
    });
    return config?.value === 'true';
  }

  async setFeatureEnabled(enabled: boolean) {
    await this.prisma.systemConfig.upsert({
      where: { key: 'demo_class_enabled' },
      update: { value: enabled ? 'true' : 'false' },
      create: { key: 'demo_class_enabled', value: enabled ? 'true' : 'false' },
    });
    return { enabled };
  }

  // ─── Admin CRUD ───────────────────────────────────────────────────────────

  async createDemoClass(dto: {
    title: string;
    grade: string;
    teacherId: number;
    scheduledAt: string;
    durationMinutes?: number;
    platform?: string;
    googleMeetLink?: string;
    capacity?: number;
  }) {
    if (!VALID_GRADES.includes(dto.grade)) {
      throw new BadRequestException('Grade must be one of: 9, 10, 11, 12');
    }

    const scheduledAt = new Date(dto.scheduledAt);
    if (scheduledAt <= new Date()) {
      throw new BadRequestException('Demo class must be scheduled in the future');
    }

    const teacher = await this.prisma.user.findUnique({ where: { id: dto.teacherId } });
    if (!teacher || teacher.role !== Role.TEACHER) {
      throw new NotFoundException('Teacher not found');
    }

    const platform = dto.platform || 'INTERNAL';
    if (platform === 'EXTERNAL' && !dto.googleMeetLink?.trim()) {
      throw new BadRequestException('Google Meet link is required for external platform');
    }

    const internalRoomId = platform === 'INTERNAL' ? `EDUSHA-Demo-${uuidv4()}` : null;
    const capacity = dto.capacity ?? 5;

    const demoClass = await this.prisma.demoClass.create({
      data: {
        title: dto.title,
        grade: dto.grade,
        teacherId: dto.teacherId,
        scheduledAt,
        durationMinutes: dto.durationMinutes || 60,
        platform,
        googleMeetLink: dto.googleMeetLink || null,
        internalRoomId,
        capacity,
      },
      include: { teacher: true, enrollments: true },
    });

    return toDemoClassResponse(demoClass);
  }

  async getAllDemoClasses() {
    const classes = await this.prisma.demoClass.findMany({
      include: { teacher: true, enrollments: true },
      orderBy: { scheduledAt: 'asc' },
    });
    return classes.map(toDemoClassResponse);
  }

  async updateDemoClass(
    id: number,
    dto: {
      title?: string;
      grade?: string;
      teacherId?: number;
      scheduledAt?: string;
      durationMinutes?: number;
      platform?: string;
      googleMeetLink?: string;
      capacity?: number;
    },
  ) {
    const demoClass = await this.prisma.demoClass.findUnique({ where: { id } });
    if (!demoClass) throw new NotFoundException('Demo class not found');
    if (demoClass.status !== DemoClassStatus.SCHEDULED) {
      throw new BadRequestException('Can only update scheduled demo classes');
    }

    if (dto.grade && !VALID_GRADES.includes(dto.grade)) {
      throw new BadRequestException('Grade must be one of: 9, 10, 11, 12');
    }

    if (dto.scheduledAt) {
      const scheduledAt = new Date(dto.scheduledAt);
      if (scheduledAt <= new Date()) {
        throw new BadRequestException('Demo class must be scheduled in the future');
      }
    }

    if (dto.teacherId) {
      const teacher = await this.prisma.user.findUnique({ where: { id: dto.teacherId } });
      if (!teacher || teacher.role !== Role.TEACHER) {
        throw new NotFoundException('Teacher not found');
      }
    }

    const updated = await this.prisma.demoClass.update({
      where: { id },
      data: {
        title: dto.title ?? demoClass.title,
        grade: dto.grade ?? demoClass.grade,
        teacherId: dto.teacherId ?? demoClass.teacherId,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : demoClass.scheduledAt,
        durationMinutes: dto.durationMinutes ?? demoClass.durationMinutes,
        platform: dto.platform ?? demoClass.platform,
        googleMeetLink: dto.googleMeetLink !== undefined ? dto.googleMeetLink : demoClass.googleMeetLink,
        capacity: dto.capacity ?? demoClass.capacity,
      },
      include: { teacher: true, enrollments: true },
    });

    return toDemoClassResponse(updated);
  }

  async cancelDemoClass(id: number) {
    const demoClass = await this.prisma.demoClass.findUnique({ where: { id } });
    if (!demoClass) throw new NotFoundException('Demo class not found');
    if (demoClass.status !== DemoClassStatus.SCHEDULED) {
      throw new BadRequestException('Can only cancel scheduled demo classes');
    }

    // Delete enrollments so students get their free demo back
    await this.prisma.demoClassEnrollment.deleteMany({ where: { demoClassId: id } });

    const updated = await this.prisma.demoClass.update({
      where: { id },
      data: { status: DemoClassStatus.CANCELLED },
      include: { teacher: true, enrollments: true },
    });

    return toDemoClassResponse(updated);
  }

  async completeDemoClass(id: number) {
    const demoClass = await this.prisma.demoClass.findUnique({ where: { id } });
    if (!demoClass) throw new NotFoundException('Demo class not found');
    if (demoClass.status !== DemoClassStatus.SCHEDULED) {
      throw new BadRequestException('Can only complete scheduled demo classes');
    }

    const updated = await this.prisma.demoClass.update({
      where: { id },
      data: { status: DemoClassStatus.COMPLETED },
      include: { teacher: true, enrollments: true },
    });

    return toDemoClassResponse(updated);
  }

  async deleteDemoClass(id: number) {
    const demoClass = await this.prisma.demoClass.findUnique({ where: { id } });
    if (!demoClass) throw new NotFoundException('Demo class not found');

    await this.prisma.demoClassEnrollment.deleteMany({ where: { demoClassId: id } });
    await this.prisma.demoClass.delete({ where: { id } });
  }

  // ─── Student ──────────────────────────────────────────────────────────────

  async getAvailableDemoClass(clerkId: string) {
    const enabled = await this.isFeatureEnabled();
    if (!enabled) {
      return { available: false, reason: 'FEATURE_DISABLED', demoClass: null };
    }

    const student = await this.prisma.user.findUnique({
      where: { clerkId },
      include: { demoEnrollment: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    if (student.demoEnrollment) {
      return { available: false, reason: 'ALREADY_USED', demoClass: null };
    }

    if (!student.grade) {
      return { available: false, reason: 'NO_GRADE', demoClass: null };
    }

    const demoClass = await this.prisma.demoClass.findFirst({
      where: {
        grade: student.grade,
        status: DemoClassStatus.SCHEDULED,
        scheduledAt: { gte: new Date() },
      },
      include: { teacher: true, enrollments: true },
      orderBy: { scheduledAt: 'asc' },
    });

    if (!demoClass) {
      return { available: false, reason: 'NONE_SCHEDULED', demoClass: null };
    }

    return {
      available: true,
      reason: null,
      demoClass: toDemoClassResponse(demoClass),
    };
  }

  async joinDemoClass(demoClassId: number, clerkId: string) {
    const enabled = await this.isFeatureEnabled();
    if (!enabled) {
      throw new ForbiddenException('Demo class feature is currently disabled');
    }

    const student = await this.prisma.user.findUnique({
      where: { clerkId },
      include: { demoEnrollment: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    if (student.demoEnrollment) {
      throw new ConflictException('You have already used your free demo class');
    }

    const demoClass = await this.prisma.demoClass.findUnique({
      where: { id: demoClassId },
      include: { enrollments: true },
    });
    if (!demoClass) throw new NotFoundException('Demo class not found');

    if (demoClass.status !== DemoClassStatus.SCHEDULED) {
      throw new BadRequestException('This demo class is no longer available');
    }

    if (demoClass.grade !== student.grade) {
      throw new ForbiddenException('This demo class is not for your grade');
    }

    if (demoClass.enrollments.length >= demoClass.capacity) {
      throw new ConflictException('This demo class is full');
    }

    if (demoClass.platform === 'EXTERNAL' && !demoClass.googleMeetLink?.trim()) {
      throw new BadRequestException('Meeting link has not been set for this demo class yet');
    }

    try {
      await this.prisma.demoClassEnrollment.create({
        data: { demoClassId, studentId: student.id },
      });
    } catch (err: any) {
      // P2002 = unique constraint — student already enrolled via race condition
      if (err?.code === 'P2002') {
        throw new ConflictException('You have already used your free demo class');
      }
      throw err;
    }

    return {
      platform: demoClass.platform,
      internalRoomId: demoClass.internalRoomId,
      googleMeetLink: demoClass.googleMeetLink,
      title: demoClass.title,
      grade: demoClass.grade,
    };
  }

  // ─── Teacher ──────────────────────────────────────────────────────────────

  async getDemoClassForTeacher(id: number, clerkId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!user) throw new NotFoundException('User not found');

    const demoClass = await this.prisma.demoClass.findUnique({
      where: { id },
      include: { teacher: true, enrollments: true },
    });
    if (!demoClass) throw new NotFoundException('Demo class not found');

    if (user.role !== Role.ADMIN && demoClass.teacherId !== user.id) {
      throw new ForbiddenException('You are not assigned to this demo class');
    }

    return toDemoClassResponse(demoClass);
  }

  async getTeacherDemoClasses(clerkId: string) {
    const teacher = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const classes = await this.prisma.demoClass.findMany({
      where: { teacherId: teacher.id },
      include: { teacher: true, enrollments: true },
      orderBy: { scheduledAt: 'asc' },
    });

    return classes.map(toDemoClassResponse);
  }
}

function toDemoClassResponse(dc: any) {
  const endTime = new Date(dc.scheduledAt);
  endTime.setMinutes(endTime.getMinutes() + (dc.durationMinutes || 60));

  return {
    id: dc.id,
    title: dc.title,
    grade: dc.grade,
    teacherId: dc.teacherId,
    teacherName: dc.teacher?.fullName || dc.teacher?.teacherCode || '',
    scheduledAt: dc.scheduledAt,
    endTime,
    durationMinutes: dc.durationMinutes,
    platform: dc.platform,
    googleMeetLink: dc.googleMeetLink,
    internalRoomId: dc.internalRoomId,
    status: dc.status,
    capacity: dc.capacity,
    enrolledCount: dc.enrollments?.length ?? 0,
    createdAt: dc.createdAt,
  };
}
