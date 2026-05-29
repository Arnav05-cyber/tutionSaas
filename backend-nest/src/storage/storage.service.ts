import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.supabase = createClient(
      config.get('SUPABASE_URL'),
      config.get('SUPABASE_SECRET_KEY'),
    );
    this.bucket = config.get('SUPABASE_BUCKET') || 'resources';
  }

  async upload(file: Express.Multer.File, storageKey: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(storageKey, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new InternalServerErrorException(`Storage upload failed: ${error.message}`);
    }
  }

  async delete(storageKey: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([storageKey]);

    if (error) {
      console.error(`Storage delete failed for ${storageKey}: ${error.message}`);
    }
  }

  generateDownloadUrl(storageKey: string): string {
    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(storageKey);

    return data.publicUrl;
  }
}
