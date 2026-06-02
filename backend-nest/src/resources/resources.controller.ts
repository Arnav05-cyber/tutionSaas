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

@Controller()
@UseGuards(ClerkAuthGuard, RolesGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post('api/batches/:batchId/resources')
  @Roles(Role.TEACHER)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  upload(
    @Param('batchId', ParseIntPipe) batchId: number,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: any,
    @ClerkId() clerkId: string,
  ) {
    return this.resourcesService.uploadResource(batchId, file, body, clerkId);
  }

  @Get('api/batches/:batchId/resources')
  getResources(
    @Param('batchId', ParseIntPipe) batchId: number,
    @Query('type') type?: string,
  ) {
    if (type?.trim()) {
      return this.resourcesService.getResourcesForBatchByType(batchId, type);
    }
    return this.resourcesService.getResourcesForBatch(batchId);
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
