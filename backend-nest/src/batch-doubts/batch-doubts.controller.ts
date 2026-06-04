import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ClerkId } from '../common/decorators/current-user.decorator';
import { BatchDoubtsService } from './batch-doubts.service';
import { CreateDoubtDto } from './dto/create-doubt.dto';
import { RespondDoubtDto } from './dto/respond-doubt.dto';

@Controller('api/batch-doubts')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class BatchDoubtsController {
  constructor(private readonly batchDoubtsService: BatchDoubtsService) {}

  @Post()
  @Roles(Role.STUDENT)
  createDoubt(@Body() body: CreateDoubtDto, @ClerkId() clerkId: string) {
    return this.batchDoubtsService.createDoubt(body, clerkId);
  }

  @Get('my')
  @Roles(Role.STUDENT)
  getMyDoubts(@ClerkId() clerkId: string) {
    return this.batchDoubtsService.getMyDoubts(clerkId);
  }

  @Get('teacher')
  @Roles(Role.TEACHER)
  getTeacherDoubts(@ClerkId() clerkId: string) {
    return this.batchDoubtsService.getTeacherDoubts(clerkId);
  }

  @Patch(':id/respond')
  @Roles(Role.TEACHER)
  respondToDoubt(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: RespondDoubtDto,
    @ClerkId() clerkId: string,
  ) {
    return this.batchDoubtsService.respondToDoubt(id, body, clerkId);
  }
}
