import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsPositive,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

class ScheduleSlotDto {
  @IsString()
  dayOfWeek: string;

  @IsString()
  startTime: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  durationMinutes?: number;
}

export class CreateBatchDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  grade: string;

  @IsNumber()
  @IsPositive()
  teacherId: number;

  @IsOptional()
  @IsNumber()
  monthlyFee?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleSlotDto)
  schedule?: ScheduleSlotDto[];
}
