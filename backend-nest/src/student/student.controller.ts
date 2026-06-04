import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { Role } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Controller('api/student')
@UseGuards(ClerkAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class StudentController {
  private razorpay: any;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.razorpay = new Razorpay({
      key_id: config.get('RAZORPAY_KEY_ID'),
      key_secret: config.get('RAZORPAY_KEY_SECRET'),
    });
  }

  @Get('fees')
  async getFees(@CurrentUser() user: any) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { id: user.id },
    });

    const batches = await this.prisma.batch.findMany({
      where: { students: { some: { id: user.id } } },
    });

    const totalFee = batches.reduce((sum, b) => sum + b.monthlyFee, 0);

    return {
      totalMonthlyFee: totalFee,
      isFeesPaidForCurrentMonth: profile?.feesPaidForCurrentMonth ?? false,
    };
  }

  @Post('fees/order')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async createOrder(@CurrentUser() user: any) {
    const batches = await this.prisma.batch.findMany({
      where: { students: { some: { id: user.id } } },
    });

    const totalFee = batches.reduce((sum, b) => sum + b.monthlyFee, 0);
    if (totalFee <= 0) throw new BadRequestException('No fees due');

    const amountInPaise = Math.round(totalFee * 100);
    const order = await this.razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `txn_${Date.now()}`,
    });

    await this.prisma.paymentHistory.create({
      data: {
        studentId: user.id,
        razorpayOrderId: order.id,
        amount: totalFee,
        status: 'CREATED',
      },
    });

    return { orderId: order.id, amount: totalFee, currency: 'INR' };
  }

  @Post('fees/verify')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyPayment(@CurrentUser() user: any, @Body() body: VerifyPaymentDto) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    const keySecret = this.config.get('RAZORPAY_KEY_SECRET');
    const generated = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    let isValid = false;
    try {
      const generatedBuf = Buffer.from(generated, 'hex');
      const signatureBuf = Buffer.from(razorpay_signature, 'hex');
      isValid =
        generatedBuf.length === signatureBuf.length &&
        crypto.timingSafeEqual(generatedBuf, signatureBuf);
    } catch {
      isValid = false;
    }

    const payment = await this.prisma.paymentHistory.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
    });

    if (payment) {
      await this.prisma.paymentHistory.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId: razorpay_payment_id,
          status: isValid ? 'SUCCESS' : 'FAILED',
        },
      });
    }

    if (isValid) {
      await this.prisma.studentProfile.update({
        where: { id: user.id },
        data: { feesPaidForCurrentMonth: true },
      });
      return { success: true, message: 'Payment verified successfully' };
    } else {
      return { success: false, message: 'Payment signature verification failed' };
    }
  }
}
