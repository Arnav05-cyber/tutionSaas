import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ClerkId } from '../common/decorators/current-user.decorator';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Controller()
@UseGuards(ClerkAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('api/batches/:batchId/sessions')
  @Roles(Role.TEACHER, Role.ADMIN)
  createSession(
    @Param('batchId', ParseIntPipe) batchId: number,
    @Body() body: CreateSessionDto,
    @ClerkId() clerkId: string,
  ) {
    return this.sessionsService.createSession(batchId, body, clerkId);
  }

  @Get('api/batches/:batchId/sessions')
  getSessionsForBatch(@Param('batchId', ParseIntPipe) batchId: number) {
    return this.sessionsService.getSessionsForBatch(batchId);
  }

  @Get('api/sessions/upcoming')
  @Roles(Role.STUDENT, Role.PARENT)
  getUpcomingSessions(@ClerkId() clerkId: string) {
    return this.sessionsService.getUpcomingSessionsForStudent(clerkId);
  }

  @Get('api/sessions/:id')
  getSession(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.getSessionById(id);
  }

  @Put('api/sessions/:id')
  @Roles(Role.TEACHER, Role.ADMIN)
  updateSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateSessionDto,
    @ClerkId() clerkId: string,
  ) {
    return this.sessionsService.updateSession(id, body, clerkId);
  }

  @Patch('api/sessions/:id/cancel')
  @Roles(Role.TEACHER, Role.ADMIN)
  cancelSession(
    @Param('id', ParseIntPipe) id: number,
    @ClerkId() clerkId: string,
  ) {
    return this.sessionsService.cancelSession(id, clerkId);
  }

  @Patch('api/sessions/:id/complete')
  @Roles(Role.TEACHER, Role.ADMIN)
  completeSession(
    @Param('id', ParseIntPipe) id: number,
    @ClerkId() clerkId: string,
  ) {
    return this.sessionsService.completeSession(id, clerkId);
  }

  @Delete('api/sessions/:id')
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(204)
  async deleteSession(
    @Param('id', ParseIntPipe) id: number,
    @ClerkId() clerkId: string,
  ) {
    await this.sessionsService.deleteSession(id, clerkId);
    return null;
  }

  @Post('api/sessions/:id/join')
  @Roles(Role.STUDENT)
  joinSession(
    @Param('id', ParseIntPipe) id: number,
    @ClerkId() clerkId: string,
  ) {
    return this.sessionsService.logStudentJoin(id, clerkId);
  }

  @Get('api/sessions/:id/join-logs')
  @Roles(Role.TEACHER, Role.ADMIN)
  getJoinLogs(
    @Param('id', ParseIntPipe) id: number,
    @ClerkId() clerkId: string,
  ) {
    return this.sessionsService.getJoinLogs(id, clerkId);
  }

  @Get('api/sessions/:id/livekit-token')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  getLivekitToken(
    @Param('id', ParseIntPipe) id: number,
    @ClerkId() clerkId: string,
  ) {
    return this.sessionsService.getLivekitToken(id, clerkId);
  }
}
