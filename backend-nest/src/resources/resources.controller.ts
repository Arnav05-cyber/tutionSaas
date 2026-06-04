import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Role } from '@prisma/client';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ClerkId } from '../common/decorators/current-user.decorator';
import { ResourcesService } from './resources.service';
import { UploadResourceDto } from './dto/upload-resource.dto';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

@Controller()
@UseGuards(ClerkAuthGuard, RolesGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post('api/batches/:batchId/resources')
  @Roles(Role.TEACHER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  upload(
    @Param('batchId', ParseIntPipe) batchId: number,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: UploadResourceDto,
    @ClerkId() clerkId: string,
  ) {
    return this.resourcesService.uploadResource(batchId, file, body, clerkId);
  }

  @Get('api/batches/:batchId/resources')
  @Roles(Role.TEACHER, Role.ADMIN, Role.STUDENT)
  getResources(
    @Param('batchId', ParseIntPipe) batchId: number,
    @ClerkId() clerkId: string,
    @Query('type') type?: string,
  ) {
    if (type?.trim()) {
      return this.resourcesService.getResourcesForBatchByType(batchId, type, clerkId);
    }
    return this.resourcesService.getResourcesForBatch(batchId, clerkId);
  }

  @Delete('api/resources/:id')
  @Roles(Role.TEACHER)
  async deleteResource(
    @Param('id', ParseIntPipe) id: number,
    @ClerkId() clerkId: string,
  ) {
    await this.resourcesService.deleteResource(id, clerkId);
    return null;
  }
}
