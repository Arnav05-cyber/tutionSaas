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
import { QueriesService } from './queries.service';
import { CreateQueryDto } from './dto/create-query.dto';
import { RespondQueryDto } from './dto/respond-query.dto';

@Controller('api/queries')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class QueriesController {
  constructor(private readonly queriesService: QueriesService) {}

  @Post()
  @Roles(Role.STUDENT)
  createQuery(@Body() body: CreateQueryDto, @ClerkId() clerkId: string) {
    return this.queriesService.createQuery(body, clerkId);
  }

  @Get('my')
  @Roles(Role.STUDENT)
  getMyQueries(@ClerkId() clerkId: string) {
    return this.queriesService.getMyQueries(clerkId);
  }

  @Get()
  @Roles(Role.ADMIN)
  getAllQueries() {
    return this.queriesService.getAllQueries();
  }

  @Patch(':id/respond')
  @Roles(Role.ADMIN)
  respondToQuery(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: RespondQueryDto,
  ) {
    return this.queriesService.replyToQuery(id, body);
  }
}
