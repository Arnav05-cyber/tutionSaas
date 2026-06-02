import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BatchDoubtsService {
  constructor(private prisma: PrismaService) {}

  async createDoubt(
    dto: { batchId: number; subject: string; message: string },
    clerkId: string,
  ) {
    const student = await this.prisma.user.findUnique({
      where: { clerkId },
      include: { enrolledBatches: { where: { id: dto.batchId } } },
    });
    if (!student) throw new NotFoundException('Student not found');
    if (student.enrolledBatches.length === 0) {
      throw new ForbiddenException('You are not enrolled in this batch');
    }

    const doubt = await this.prisma.batchDoubt.create({
      data: {
        studentId: student.id,
        batchId: dto.batchId,
        subject: dto.subject,
        message: dto.message,
      },
      include: { student: true, batch: { include: { teacher: true } } },
    });

    return toDoubtResponse(doubt);
  }

  async getMyDoubts(clerkId: string) {
    const student = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!student) throw new NotFoundException('Student not found');

    const doubts = await this.prisma.batchDoubt.findMany({
      where: { studentId: student.id },
      include: { student: true, batch: { include: { teacher: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return doubts.map(toDoubtResponse);
  }

  async getTeacherDoubts(clerkId: string) {
    const teacher = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const doubts = await this.prisma.batchDoubt.findMany({
      where: { batch: { teacherId: teacher.id } },
      include: { student: true, batch: { include: { teacher: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return doubts.map(toDoubtResponse);
  }

  async respondToDoubt(
    id: number,
    dto: { response: string },
    clerkId: string,
  ) {
    const teacher = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const doubt = await this.prisma.batchDoubt.findUnique({
      where: { id },
      include: { batch: true },
    });
    if (!doubt) throw new NotFoundException('Doubt not found');
    if (doubt.batch.teacherId !== teacher.id) {
      throw new ForbiddenException('You are not the teacher of this batch');
    }

    const updated = await this.prisma.batchDoubt.update({
      where: { id },
      data: { response: dto.response, status: QueryStatus.RESOLVED },
      include: { student: true, batch: { include: { teacher: true } } },
    });

    return toDoubtResponse(updated);
  }
}

function toDoubtResponse(doubt: any) {
  return {
    id: doubt.id,
    subject: doubt.subject,
    message: doubt.message,
    response: doubt.response,
    status: doubt.status,
    studentId: doubt.studentId,
    studentName: doubt.student?.fullName || doubt.student?.email,
    batchId: doubt.batchId,
    batchName: doubt.batch?.name,
    teacherCode: doubt.batch?.teacher?.teacherCode || null,
    createdAt: doubt.createdAt,
    updatedAt: doubt.updatedAt,
  };
}
