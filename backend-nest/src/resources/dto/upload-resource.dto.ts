import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UploadResourceDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  formLink?: string;
}
