import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Role } from '@prisma/client';

@Injectable()
export class BatchesService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async createBatch(dto: {
    name: string;
    grade: string;
    teacherId: number;
    monthlyFee?: number;
    schedule?: { dayOfWeek: string; startTime: string; durationMinutes?: number }[];
  }) {
    const teacher = await this.prisma.user.findUnique({ where: { id: dto.teacherId } });
    if (!teacher) throw new NotFoundException('Teacher not found');
    if (teacher.role !== Role.TEACHER) throw new BadRequestException('Assigned user is not a teacher');

    const batch = await this.prisma.batch.create({
      data: {
        name: dto.name,
        grade: dto.grade,
        teacherId: dto.teacherId,
        monthlyFee: dto.monthlyFee || 0,
        scheduleSlots: dto.schedule
          ? {
              create: dto.schedule.map((s) => ({
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                durationMinutes: s.durationMinutes || 60,
              })),
            }
          : undefined,
      },
      include: { teacher: true, students: true, scheduleSlots: true },
    });

    return toBatchResponse(batch);
  }

  async getAllBatches() {
    const batches = await this.prisma.batch.findMany({
      where: { isActive: true },
      include: { teacher: true, students: true, scheduleSlots: true },
    });
    return batches.map(toBatchResponse);
  }

  async getTeacherBatches(clerkId: string) {
    const teacher = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const batches = await this.prisma.batch.findMany({
      where: { teacherId: teacher.id },
      include: { teacher: true, students: true, scheduleSlots: true },
    });
    return batches.map(toBatchResponse);
  }

  async getStudentBatches(clerkId: string) {
    const student = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!student) throw new NotFoundException('Student not found');

    const batches = await this.prisma.batch.findMany({
      where: { students: { some: { id: student.id } } },
      include: { teacher: true, students: true, scheduleSlots: true },
    });
    return batches.map(toBatchResponse);
  }

  async getBatchById(batchId: number) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: { teacher: true, students: true, scheduleSlots: true },
    });
    if (!batch) throw new NotFoundException('Batch not found');
    return toBatchResponse(batch);
  }

  async addStudentToBatch(batchId: number, studentId: number) {
    const student = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');
    if (student.role !== Role.STUDENT) throw new BadRequestException('Can only add students to batches');

    const batch = await this.prisma.batch.update({
      where: { id: batchId },
      data: { students: { connect: { id: studentId } } },
      include: { teacher: true, students: true, scheduleSlots: true },
    });
    return toBatchResponse(batch);
  }

  async removeStudentFromBatch(batchId: number, studentId: number) {
    const batch = await this.prisma.batch.update({
      where: { id: batchId },
      data: { students: { disconnect: { id: studentId } } },
      include: { teacher: true, students: true, scheduleSlots: true },
    });
    return toBatchResponse(batch);
  }

  async assignTeacher(batchId: number, teacherId: number) {
    const teacher = await this.prisma.user.findUnique({ where: { id: teacherId } });
    if (!teacher) throw new NotFoundException('Teacher not found');
    if (teacher.role !== Role.TEACHER) throw new BadRequestException('Assigned user is not a teacher');

    const batch = await this.prisma.batch.update({
      where: { id: batchId },
      data: { teacherId },
      include: { teacher: true, students: true, scheduleSlots: true },
    });
    return toBatchResponse(batch);
  }

  async getAvailableBatchesForStudent(clerkId: string) {
    const student = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!student) throw new NotFoundException('Student not found');
    if (!student.grade) return [];

    const activeBatches = await this.prisma.batch.findMany({
      where: {
        isActive: true,
        grade: student.grade,
        students: { none: { id: student.id } },
      },
      include: { teacher: true, students: true, scheduleSlots: true },
    });

    // Filter out batches where student has a pending join request
    const pendingRequests = await this.prisma.batchJoinRequest.findMany({
      where: { studentId: student.id, status: 'PENDING' },
    });
    const pendingBatchIds = new Set(pendingRequests.map((r) => r.batchId));

    return activeBatches
      .filter((b) => !pendingBatchIds.has(b.id))
      .map(toBatchResponse);
  }

  async requestJoinBatch(clerkId: string, batchId: number) {
    const student = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!student) throw new NotFoundException('Student not found');

    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: { students: true },
    });
    if (!batch) throw new NotFoundException('Batch not found');

    if (batch.students.some((s) => s.id === student.id)) {
      throw new BadRequestException('Already enrolled in this batch');
    }

    const existing = await this.prisma.batchJoinRequest.findFirst({
      where: { studentId: student.id, batchId, status: 'PENDING' },
    });
    if (existing) throw new BadRequestException('Join request already pending');

    await this.prisma.batchJoinRequest.create({
      data: { studentId: student.id, batchId },
    });
  }

  async getPendingJoinRequests() {
    const requests = await this.prisma.batchJoinRequest.findMany({
      where: { status: 'PENDING' },
      include: { student: true, batch: true },
    });

    return requests.map((req) => ({
      id: req.id,
      studentId: req.student.id,
      studentName: req.student.fullName || req.student.email,
      studentGrade: req.student.grade,
      batchId: req.batch.id,
      batchName: req.batch.name,
      batchGrade: req.batch.grade,
      status: req.status,
      createdAt: req.createdAt.toISOString(),
    }));
  }

  async approveJoinRequest(requestId: number) {
    const request = await this.prisma.batchJoinRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Request not found');

    await this.prisma.batchJoinRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' },
    });

    await this.addStudentToBatch(request.batchId, request.studentId);
  }

  async rejectJoinRequest(requestId: number) {
    const request = await this.prisma.batchJoinRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Request not found');

    await this.prisma.batchJoinRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });
  }

  async deleteBatch(batchId: number) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: { sessions: true, resources: true },
    });
    if (!batch) throw new NotFoundException('Batch not found');

    // 1. Attendance records for all sessions in this batch
    await this.prisma.attendanceRecord.deleteMany({
      where: { session: { batchId } },
    });

    // 2. Session join logs for all sessions
    await this.prisma.sessionJoinLog.deleteMany({
      where: { session: { batchId } },
    });

    // 3. Delete class sessions
    await this.prisma.classSession.deleteMany({ where: { batchId } });

    // 4. Delete batch join requests
    await this.prisma.batchJoinRequest.deleteMany({ where: { batchId } });

    // 5. Delete resources (with storage cleanup)
    for (const r of batch.resources) {
      try { await this.storage.delete(r.storageKey); } catch (e) { console.error(e); }
    }
    await this.prisma.resource.deleteMany({ where: { batchId } });

    // 6. Schedule slots
    await this.prisma.scheduleSlot.deleteMany({ where: { batchId } });

    // 7. Clear students
    await this.prisma.batch.update({
      where: { id: batchId },
      data: { students: { set: [] } },
    });

    // 8. Delete batch
    await this.prisma.batch.delete({ where: { id: batchId } });
  }
}

function toBatchResponse(batch: any) {
  return {
    id: batch.id,
    name: batch.name,
    grade: batch.grade,
    teacherId: batch.teacherId,
    teacherCode: batch.teacher?.teacherCode || null,
    studentCount: batch.students?.length || 0,
    isActive: batch.isActive,
    monthlyFee: batch.monthlyFee,
    schedule: (batch.scheduleSlots || []).map((s: any) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      durationMinutes: s.durationMinutes,
    })),
    students: (batch.students || []).map((s: any) => ({
      id: s.id,
      fullName: s.fullName,
      email: s.email,
      grade: s.grade,
    })),
  };
}
