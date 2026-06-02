import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
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
    },
  ) {
    const role = dto.role.toUpperCase() as Role;

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
      console.log(`User not found for clerkId: ${clerkId} — skipping deletion`);
      return;
    }

    const userId = user.id;

    // 1. Delete attendance records
    await this.prisma.attendanceRecord.deleteMany({ where: { studentId: userId } });

    // 2. Delete session join logs
    await this.prisma.sessionJoinLog.deleteMany({ where: { studentId: userId } });

    // 3. Delete batch join requests
    await this.prisma.batchJoinRequest.deleteMany({ where: { studentId: userId } });

    // 4. Delete payment history
    await this.prisma.paymentHistory.deleteMany({ where: { studentId: userId } });

    // 5. Delete resources (with storage cleanup)
    const resources = await this.prisma.resource.findMany({ where: { uploadedById: userId } });
    for (const r of resources) {
      try { await this.storage.delete(r.storageKey); } catch (e) { console.error(e); }
    }
    await this.prisma.resource.deleteMany({ where: { uploadedById: userId } });

    // 6. Remove from batch students (handled by Prisma implicit many-to-many disconnect)
    const batches = await this.prisma.batch.findMany({
      where: { students: { some: { id: userId } } },
    });
    for (const batch of batches) {
      await this.prisma.batch.update({
        where: { id: batch.id },
        data: { students: { disconnect: { id: userId } } },
      });
    }

    // 7. Delete profile
    if (user.role === Role.TEACHER) {
      await this.prisma.teacherProfile.deleteMany({ where: { id: userId } });
    } else if (user.role === Role.STUDENT) {
      await this.prisma.studentProfile.deleteMany({ where: { id: userId } });
    } else if (user.role === Role.PARENT) {
      await this.prisma.parentProfile.deleteMany({ where: { id: userId } });
    }

    // 8. Delete user
    await this.prisma.user.delete({ where: { id: userId } });
    console.log(`User ${userId} deleted successfully`);
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
      code = Array.from({ length: 6 }, () =>
        chars[Math.floor(Math.random() * chars.length)],
      ).join('');
    } while (
      await this.prisma.studentProfile.findUnique({ where: { parentLinkCode: code } })
    );
    return code;
  }
}
