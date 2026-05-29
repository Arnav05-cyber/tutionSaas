import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { BatchesService } from '../batches/batches.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/admin')
@UseGuards(ClerkAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private batchesService: BatchesService,
    private usersService: UsersService,
    private prisma: PrismaService,
  ) {}

  @Post('invites')
  generateInvite() {
    return this.adminService.generateTeacherInvite();
  }

  @Get('invites')
  getAllInvites() {
    return this.adminService.getAllInvites();
  }

  @Get('users')
  async getUsersByRole(@Query('role') role: string) {
    const r = role.toUpperCase() as Role;
    const users = await this.prisma.user.findMany({ where: { role: r } });
    return users.map((u) => ({
      id: u.id,
      fullName: u.fullName || '',
      email: u.email || '',
      grade: u.grade || '',
    }));
  }

  @Delete('users/:id')
  async forceDeleteUser(@Param('id', ParseIntPipe) id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('User not found');
    await this.usersService.deleteUserByClerkId(user.clerkId);
    return null;
  }

  @Get('fees')
  getAllFeeStatus() {
    return this.adminService.getAllFeeStatus();
  }

  @Put('students/:id/block')
  async blockStudent(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.blockStudent(id);
    return null;
  }

  @Put('students/:id/unblock')
  async unblockStudent(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.unblockStudent(id);
    return null;
  }

  @Put('batches/:id/fee')
  async setMonthlyFee(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { monthlyFee: number },
  ) {
    await this.adminService.setMonthlyFee(id, body.monthlyFee || 0);
    return null;
  }

  @Delete('batches/:id')
  async deleteBatch(@Param('id', ParseIntPipe) id: number) {
    await this.batchesService.deleteBatch(id);
    return null;
  }

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('join-requests')
  getJoinRequests() {
    return this.batchesService.getPendingJoinRequests();
  }

  @Post('join-requests/:id/approve')
  async approveJoinRequest(@Param('id', ParseIntPipe) id: number) {
    await this.batchesService.approveJoinRequest(id);
    return null;
  }

  @Post('join-requests/:id/reject')
  async rejectJoinRequest(@Param('id', ParseIntPipe) id: number) {
    await this.batchesService.rejectJoinRequest(id);
    return null;
  }
}
