import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { Role } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ClerkId } from '../common/decorators/current-user.decorator';
import { ParentService } from './parent.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/parent')
@UseGuards(ClerkAuthGuard, RolesGuard)
@Roles(Role.PARENT)
export class ParentController {
  private razorpay: any;

  constructor(
    private parentService: ParentService,
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.razorpay = new Razorpay({
      key_id: config.get('RAZORPAY_KEY_ID'),
      key_secret: config.get('RAZORPAY_KEY_SECRET'),
    });
  }

  @Post('link')
  async linkToStudent(
    @ClerkId() clerkId: string,
    @Body() body: { linkCode: string },
  ) {
    await this.parentService.linkToStudent(clerkId, body.linkCode);
    return null;
  }

  @Get('students')
  getLinkedStudents(@ClerkId() clerkId: string) {
    return this.parentService.getLinkedStudents(clerkId);
  }

  @Get('students/:studentId/attendance')
  getStudentAttendance(
    @ClerkId() clerkId: string,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('batchId', ParseIntPipe) batchId: number,
  ) {
    return this.parentService.getStudentAttendance(clerkId, studentId, batchId);
  }

  @Get('students/:studentId/fees')
  getStudentFeeStatus(
    @ClerkId() clerkId: string,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return this.parentService.getStudentFeeStatus(clerkId, studentId);
  }

  @Get('students/:studentId/batches')
  getStudentBatches(
    @ClerkId() clerkId: string,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return this.parentService.getStudentBatches(clerkId, studentId);
  }

  @Get('students/:studentId/sessions')
  getStudentSessions(
    @ClerkId() clerkId: string,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return this.parentService.getStudentSessions(clerkId, studentId);
  }

  @Post('students/:studentId/fees/order')
  async createOrder(
    @ClerkId() clerkId: string,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    await this.parentService.getStudentFeeStatus(clerkId, studentId); // asserts link

    const student = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (!student) throw new BadRequestException('Student not found');

    const batches = await this.prisma.batch.findMany({
      where: { students: { some: { id: studentId } } },
    });
    const totalFee = batches.reduce((sum, b) => sum + b.monthlyFee, 0);
    if (totalFee <= 0) throw new BadRequestException('No fees due');

    const order = await this.razorpay.orders.create({
      amount: Math.round(totalFee * 100),
      currency: 'INR',
      receipt: `txn_${Date.now()}`,
    });

    await this.prisma.paymentHistory.create({
      data: {
        studentId,
        razorpayOrderId: order.id,
        amount: totalFee,
        status: 'CREATED',
      },
    });

    return { orderId: order.id, amount: totalFee, currency: 'INR' };
  }

  @Post('students/:studentId/fees/verify')
  async verifyPayment(
    @ClerkId() clerkId: string,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Body() body: any,
  ) {
    await this.parentService.getStudentFeeStatus(clerkId, studentId); // asserts link

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    const keySecret = this.config.get('RAZORPAY_KEY_SECRET');

    const generated = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = generated === razorpay_signature;

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
        where: { id: studentId },
        data: { feesPaidForCurrentMonth: true },
      });
      return { success: true, message: 'Payment verified successfully' };
    }
    return { success: false, message: 'Payment signature verification failed' };
  }
}
