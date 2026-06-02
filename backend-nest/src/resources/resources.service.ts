import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ResourceType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ResourcesService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async uploadResource(
    batchId: number,
    file: Express.Multer.File | undefined,
    dto: { title: string; description?: string; type: string; formLink?: string },
    clerkId: string,
  ) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: { teacher: true },
    });
    if (!batch) throw new NotFoundException('Batch not found');

    const teacher = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    if (batch.teacher.id !== teacher.id) {
      throw new ForbiddenException('You can only upload resources to your own batches');
    }

    const type = dto.type.toUpperCase() as ResourceType;
    const isMcq = type === ResourceType.MCQ;

    let storageKey: string | null = null;
    if (!isMcq) {
      if (!file) throw new ForbiddenException('File is required for this resource type');
      storageKey = `batch-${batchId}/${uuidv4()}_${file.originalname}`;
      await this.storage.upload(file, storageKey);
    }

    const resource = await this.prisma.resource.create({
      data: {
        batchId,
        uploadedById: teacher.id,
        title: dto.title,
        description: dto.description || null,
        type,
        fileName: file?.originalname || null,
        storageKey,
        fileSizeBytes: file ? BigInt(file.size) : BigInt(0),
        formLink: isMcq ? (dto.formLink || null) : null,
      },
    });

    const downloadUrl = storageKey ? this.storage.generateDownloadUrl(storageKey) : null;
    return toResourceResponse(resource, downloadUrl);
  }

  async getResourcesForBatch(batchId: number) {
    const resources = await this.prisma.resource.findMany({
      where: { batchId },
      orderBy: { uploadedAt: 'desc' },
      include: { uploadedBy: true },
    });
    return resources.map((r) =>
      toResourceResponse(r, r.storageKey ? this.storage.generateDownloadUrl(r.storageKey) : null),
    );
  }

  async getResourcesForBatchByType(batchId: number, type: string) {
    const resources = await this.prisma.resource.findMany({
      where: { batchId, type: type.toUpperCase() as ResourceType },
      orderBy: { uploadedAt: 'desc' },
      include: { uploadedBy: true },
    });
    return resources.map((r) =>
      toResourceResponse(r, r.storageKey ? this.storage.generateDownloadUrl(r.storageKey) : null),
    );
  }

  async deleteResource(resourceId: number, clerkId: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
      include: { uploadedBy: true },
    });
    if (!resource) throw new NotFoundException('Resource not found');

    const teacher = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    if (resource.uploadedBy.id !== teacher.id) {
      throw new ForbiddenException('You can only delete your own resources');
    }

    if (resource.storageKey) {
      try { await this.storage.delete(resource.storageKey); } catch (e) { console.error(e); }
    }
    await this.prisma.resource.delete({ where: { id: resourceId } });
  }
}

function toResourceResponse(resource: any, downloadUrl: string | null) {
  return {
    id: resource.id,
    batchId: resource.batchId,
    title: resource.title,
    description: resource.description,
    type: resource.type,
    fileName: resource.fileName,
    fileSizeBytes: resource.fileSizeBytes?.toString(),
    uploadedAt: resource.uploadedAt,
    teacherCode: resource.uploadedBy?.teacherCode ?? null,
    formLink: resource.formLink ?? null,
    downloadUrl,
  };
}
