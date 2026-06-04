import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  IsDateString,
  IsIn,
  MaxLength,
} from 'class-validator';

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  googleMeetLink?: string;

  @IsOptional()
  @IsIn(['LIVEKIT', 'EXTERNAL'])
  platform?: string;
}
