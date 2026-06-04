import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private audit: AuditService,
  ) {}

  async onboard(
    clerkId: string,
    email: string,
    dto: {
      role: string;
      phoneNumber?: string;
      grade?: string;
      fullName?: string;
      inviteToken?: string;
      bio?: string;
      qualification?: string;
      consentGiven?: boolean;
    },
  ) {
    if (!dto.consentGiven) {
      throw new BadRequestException('Consent to privacy policy is required');
    }

    const normalizedRole = dto.role.toUpperCase();
    const allowedRoles: Role[] = [Role.TEACHER, Role.STUDENT, Role.PARENT];
    if (!allowedRoles.includes(normalizedRole as Role)) {
      throw new BadRequestException('Invalid role');
    }
    const role = normalizedRole as Role;

    if (role === Role.TEACHER) {
      if (!dto.inviteToken?.trim()) {
        throw new BadRequestException('Teacher signup requires a valid invite token');
      }
      const invite = await this.prisma.teacherInvite.findFirst({
        where: { token: dto.inviteToken, used: false },
      });
      if (!invite) throw new BadRequestException('Invalid or expired invite token');
      if (invite.expiresAt && new Date() > invite.expiresAt) {
        throw new BadRequestException('Invite token has expired');
      }
      await this.prisma.teacherInvite.update({
        where: { id: invite.id },
        data: { used: true },
      });
    }

    let teacherCode: string | null = null;
    if (role === Role.TEACHER && dto.fullName) {
      teacherCode = await this.generateUniqueTeacherCode(dto.fullName);
    }

    const user = await this.prisma.user.create({
      data: {
        clerkId,
        email,
        fullName: dto.fullName || null,
        phoneNumber: dto.phoneNumber || null,
        grade: dto.grade || null,
        role,
        onboardingComplete: true,
        consentGivenAt: new Date(),
        ...(teacherCode ? { teacherCode } : {}),
      },
    });

    if (role === Role.TEACHER) {
      await this.prisma.teacherProfile.create({
        data: {
          id: user.id,
          bio: dto.bio || null,
          qualification: dto.qualification || null,
        },
      });
    } else if (role === Role.STUDENT) {
      await this.prisma.studentProfile.create({ data: { id: user.id } });
    } else if (role === Role.PARENT) {
      await this.prisma.parentProfile.create({ data: { id: user.id } });
    }

    await this.audit.log('USER_ONBOARDED', user.id, 'User', `role=${role}`);
    return user;
  }

  async generateParentLinkCode(clerkId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== Role.STUDENT) {
      throw new BadRequestException('Only students can generate a parent link code');
    }

    const profile = await this.prisma.studentProfile.findUnique({
      where: { id: user.id },
    });
    if (!profile) throw new NotFoundException('Student profile not found');

    if (profile.parentLinkCode) return profile.parentLinkCode;

    const code = await this.generateUniqueCode();
    await this.prisma.studentProfile.update({
      where: { id: user.id },
      data: { parentLinkCode: code },
    });
    return code;
  }

  async ensureTeacherCode(user: any): Promise<any> {
    if (user?.role !== Role.TEACHER || user.teacherCode || !user.fullName) {
      return user;
    }
    const code = await this.generateUniqueTeacherCode(user.fullName);
    return this.prisma.user.update({
      where: { id: user.id },
      data: { teacherCode: code },
    });
  }

  async updateEmail(clerkId: string, email?: string) {
    if (!email) {
      return this.prisma.user.findUnique({ where: { clerkId } });
    }
    return this.prisma.user.update({
      where: { clerkId },
      data: { email },
    });
  }

  async deleteUserByClerkId(clerkId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return;
    }

    const userId = user.id;

    await this.prisma.attendanceRecord.deleteMany({ where: { studentId: userId } });
    await this.prisma.sessionJoinLog.deleteMany({ where: { studentId: userId } });
    await this.prisma.batchJoinRequest.deleteMany({ where: { studentId: userId } });
    await this.prisma.paymentHistory.deleteMany({ where: { studentId: userId } });

    const resources = await this.prisma.resource.findMany({ where: { uploadedById: userId } });
    for (const r of resources) {
      try { await this.storage.delete(r.storageKey); } catch (e) { /* ignore */ }
    }
    await this.prisma.resource.deleteMany({ where: { uploadedById: userId } });

    const batches = await this.prisma.batch.findMany({
      where: { students: { some: { id: userId } } },
    });
    for (const batch of batches) {
      await this.prisma.batch.update({
        where: { id: batch.id },
        data: { students: { disconnect: { id: userId } } },
      });
    }

    if (user.role === Role.TEACHER) {
      await this.prisma.teacherProfile.deleteMany({ where: { id: userId } });
    } else if (user.role === Role.STUDENT) {
      await this.prisma.studentProfile.deleteMany({ where: { id: userId } });
    } else if (user.role === Role.PARENT) {
      await this.prisma.parentProfile.deleteMany({ where: { id: userId } });
    }

    await this.prisma.user.delete({ where: { id: userId } });
    await this.audit.log('USER_DELETED', undefined, 'User', `userId=${userId}`);
  }

  private async generateUniqueTeacherCode(fullName: string): Promise<string> {
    const parts = fullName.trim().split(/\s+/);
    const first = (parts[0]?.[0] || '').toLowerCase();
    const second = parts.length >= 2 ? (parts[parts.length - 1]?.[0] || '').toLowerCase() : '';
    const base = `edusha_${first}${second}`;

    const exists = await this.prisma.user.findUnique({ where: { teacherCode: base } });
    if (!exists) return base;

    let suffix = 2;
    while (true) {
      const candidate = `${base}${suffix}`;
      const taken = await this.prisma.user.findUnique({ where: { teacherCode: candidate } });
      if (!taken) return candidate;
      suffix++;
    }
  }

  private async generateUniqueCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    do {
      const bytes = randomBytes(6);
      code = Array.from(bytes)
        .map((b) => chars[b % chars.length])
        .join('');
    } while (
      await this.prisma.studentProfile.findUnique({ where: { parentLinkCode: code } })
    );
    return code;
  }
}
