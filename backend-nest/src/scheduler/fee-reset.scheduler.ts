import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeeResetScheduler {
  constructor(private prisma: PrismaService) {}

  // Runs at midnight on the 1st of every month
  @Cron('0 0 1 * *')
  async resetMonthlyFees() {
    console.log('Running automated monthly fee reset scheduler...');
    await this.prisma.studentProfile.updateMany({
      data: { feesPaidForCurrentMonth: false },
    });
    console.log('Successfully reset all student fee statuses to Unpaid for the new month.');
  }
}
