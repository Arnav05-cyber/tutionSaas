import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryStatus } from '@prisma/client';

@Injectable()
export class QueriesService {
  constructor(private prisma: PrismaService) {}

  async createQuery(
    dto: { subject: string; message: string },
    clerkId: string,
  ) {
    const student = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!student) throw new NotFoundException('Student not found');

    const query = await this.prisma.studentQuery.create({
      data: {
        studentId: student.id,
        subject: dto.subject,
        message: dto.message,
      },
      include: { student: true },
    });

    return toQueryResponse(query);
  }

  async getMyQueries(clerkId: string) {
    const student = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!student) throw new NotFoundException('Student not found');

    const queries = await this.prisma.studentQuery.findMany({
      where: { studentId: student.id },
      include: { student: true },
      orderBy: { createdAt: 'desc' },
    });

    return queries.map(toQueryResponse);
  }

  async getAllQueries() {
    const queries = await this.prisma.studentQuery.findMany({
      include: { student: true },
      orderBy: { createdAt: 'desc' },
    });
    return queries.map(toQueryResponse);
  }

  async replyToQuery(queryId: number, dto: { response: string }) {
    const query = await this.prisma.studentQuery.findUnique({
      where: { id: queryId },
    });
    if (!query) throw new NotFoundException('Query not found');

    const updated = await this.prisma.studentQuery.update({
      where: { id: queryId },
      data: { response: dto.response, status: QueryStatus.RESOLVED },
      include: { student: true },
    });

    return toQueryResponse(updated);
  }
}

function toQueryResponse(query: any) {
  return {
    id: query.id,
    subject: query.subject,
    message: query.message,
    response: query.response,
    status: query.status,
    studentId: query.studentId,
    studentName: query.student?.fullName || query.student?.email,
    createdAt: query.createdAt,
    updatedAt: query.updatedAt,
  };
}
