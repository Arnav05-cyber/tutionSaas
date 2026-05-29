import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, ClerkId } from '../common/decorators/current-user.decorator';
import { BatchesService } from './batches.service';

@Controller('api/batches')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  @Roles(Role.ADMIN)
  createBatch(@Body() body: any) {
    return this.batchesService.createBatch(body);
  }

  @Get()
  @Roles(Role.ADMIN)
  getAllBatches() {
    return this.batchesService.getAllBatches();
  }

  @Get('my')
  getMyBatches(@ClerkId() clerkId: string, @CurrentUser() user: any) {
    if (user.role === Role.TEACHER) {
      return this.batchesService.getTeacherBatches(clerkId);
    }
    return this.batchesService.getStudentBatches(clerkId);
  }

  @Get('available')
  @Roles(Role.STUDENT)
  getAvailableBatches(@ClerkId() clerkId: string) {
    return this.batchesService.getAvailableBatchesForStudent(clerkId);
  }

  @Get(':id')
  getBatch(@Param('id', ParseIntPipe) id: number) {
    return this.batchesService.getBatchById(id);
  }

  @Post(':id/students/:studentId')
  @Roles(Role.ADMIN)
  addStudent(
    @Param('id', ParseIntPipe) id: number,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return this.batchesService.addStudentToBatch(id, studentId);
  }

  @Delete(':id/students/:studentId')
  @Roles(Role.ADMIN)
  removeStudent(
    @Param('id', ParseIntPipe) id: number,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return this.batchesService.removeStudentFromBatch(id, studentId);
  }

  @Put(':id/teacher/:teacherId')
  @Roles(Role.ADMIN)
  assignTeacher(
    @Param('id', ParseIntPipe) id: number,
    @Param('teacherId', ParseIntPipe) teacherId: number,
  ) {
    return this.batchesService.assignTeacher(id, teacherId);
  }

  @Post(':id/join')
  @Roles(Role.STUDENT)
  async requestJoin(
    @Param('id', ParseIntPipe) id: number,
    @ClerkId() clerkId: string,
  ) {
    await this.batchesService.requestJoinBatch(clerkId, id);
    return null;
  }
}
