import {
  IsString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsIn,
  IsDateString,
  MaxLength,
  Max,
  Min,
} from 'class-validator';

export class UpdateDemoClassDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsIn(['9', '10', '11', '12'])
  grade?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  teacherId?: number;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  durationMinutes?: number;

  @IsOptional()
  @IsIn(['INTERNAL', 'EXTERNAL'])
  platform?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  googleMeetLink?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  capacity?: number;
}
