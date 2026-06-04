import { IsArray, ValidateNested, IsNumber, IsBoolean, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

class AttendanceEntryDto {
  @IsNumber()
  @IsPositive()
  studentId: number;

  @IsBoolean()
  present: boolean;
}

export class MarkAttendanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceEntryDto)
  entries: AttendanceEntryDto[];
}
