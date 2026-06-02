import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  log(action: string, userId?: number, target?: string, detail?: string) {
    return this.prisma.auditLog.create({
      data: { action, userId: userId ?? null, target: target ?? null, detail: detail ?? null },
    });
  }
}
