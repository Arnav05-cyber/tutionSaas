import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ResourceType, Role } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/mpeg',
  'video/webm',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

function sanitizeFilename(name: string): string {
  return path
    .basename(name)
    .replace(/[^a-zA-Z0-9._\-]/g, '_')
    .slice(0, 200);
}

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

    const normalizedType = dto.type.toUpperCase();
    if (!Object.values(ResourceType).includes(normalizedType as ResourceType)) {
      throw new BadRequestException(
        `Invalid resource type. Must be one of: ${Object.values(ResourceType).join(', ')}`,
      );
    }
    const type = normalizedType as ResourceType;
    const isMcq = type === ResourceType.MCQ;

    let storageKey: string | null = null;
    if (!isMcq) {
      if (!file) throw new BadRequestException('File is required for this resource type');
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        throw new BadRequestException('File type not allowed');
      }
      const safeName = sanitizeFilename(file.originalname);
      storageKey = `batch-${batchId}/${uuidv4()}_${safeName}`;
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

  async getResourcesForBatch(batchId: number, clerkId: string) {
    await this.assertBatchAccess(batchId, clerkId);
    const resources = await this.prisma.resource.findMany({
      where: { batchId },
      orderBy: { uploadedAt: 'desc' },
      include: { uploadedBy: true },
    });
    return resources.map((r) =>
      toResourceResponse(r, r.storageKey ? this.storage.generateDownloadUrl(r.storageKey) : null),
    );
  }

  async getResourcesForBatchByType(batchId: number, type: string, clerkId: string) {
    await this.assertBatchAccess(batchId, clerkId);
    const normalizedType = type.toUpperCase();
    if (!Object.values(ResourceType).includes(normalizedType as ResourceType)) {
      throw new BadRequestException(
        `Invalid resource type. Must be one of: ${Object.values(ResourceType).join(', ')}`,
      );
    }
    const resources = await this.prisma.resource.findMany({
      where: { batchId, type: normalizedType as ResourceType },
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
      try { await this.storage.delete(resource.storageKey); } catch (e) { /* already gone */ }
    }
    await this.prisma.resource.delete({ where: { id: resourceId } });
  }

  private async assertBatchAccess(batchId: number, clerkId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === Role.ADMIN) return;

    if (user.role === Role.TEACHER) {
      const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
      if (!batch || batch.teacherId !== user.id) {
        throw new ForbiddenException('Access denied');
      }
      return;
    }

    if (user.role === Role.STUDENT) {
      const enrolled = await this.prisma.batch.findFirst({
        where: { id: batchId, students: { some: { id: user.id } } },
      });
      if (!enrolled) throw new ForbiddenException('Access denied');
      return;
    }

    throw new ForbiddenException('Access denied');
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
