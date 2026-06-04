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

export class CreateDemoClassDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsIn(['9', '10', '11', '12'])
  grade: string;

  @IsNumber()
  @IsPositive()
  teacherId: number;

  @IsDateString()
  scheduledAt: string;

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
