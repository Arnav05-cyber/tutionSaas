import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AdminInitService implements OnApplicationBootstrap {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const secretKey = this.config.get('CLERK_SECRET_KEY');
    if (!secretKey) {
      console.log('No CLERK_SECRET_KEY provided, skipping Admin Init.');
      return;
    }

    const targetEmail = this.config.get('ADMIN_EMAIL');
    const targetPassword = this.config.get('ADMIN_PASSWORD');

    if (!targetEmail || !targetPassword) {
      console.log('ADMIN_EMAIL or ADMIN_PASSWORD not configured, skipping Admin Init.');
      return;
    }

    let clerkId: string | null = null;

    try {
      const searchRes = await fetch(
        `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(targetEmail)}`,
        { headers: { Authorization: `Bearer ${secretKey}` } },
      );
      const users = await searchRes.json() as any[];

      if (Array.isArray(users) && users.length > 0) {
        clerkId = users[0].id;
        console.log('Admin user already exists in Clerk.');
      } else {
        const createRes = await fetch('https://api.clerk.com/v1/users', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email_address: [targetEmail],
            password: targetPassword,
            first_name: 'Admin',
            last_name: 'User',
            skip_password_checks: true,
          }),
        });
        const created = await createRes.json() as any;
        clerkId = created.id;
        console.log('Admin user created in Clerk.');
      }
    } catch (e) {
      console.error('Error communicating with Clerk API during admin init.');
      return;
    }

    if (!clerkId) return;

    let existing = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!existing) {
      existing = await this.prisma.user.findFirst({ where: { email: targetEmail } });
    }

    if (!existing) {
      await this.prisma.user.create({
        data: {
          clerkId,
          email: targetEmail,
          fullName: 'Admin',
          role: Role.ADMIN,
          onboardingComplete: true,
        },
      });
      console.log('Admin user saved to database.');
    } else {
      const updates: any = {};
      if (existing.clerkId !== clerkId) updates.clerkId = clerkId;
      if (existing.role !== Role.ADMIN) updates.role = Role.ADMIN;

      if (Object.keys(updates).length > 0) {
        await this.prisma.user.update({ where: { id: existing.id }, data: updates });
        console.log('Admin user record updated.');
      }
    }
  }
}
