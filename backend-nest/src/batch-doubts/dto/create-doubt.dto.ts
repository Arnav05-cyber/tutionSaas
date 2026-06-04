import { IsString, IsNumber, IsPositive, MaxLength } from 'class-validator';

export class CreateDoubtDto {
  @IsNumber()
  @IsPositive()
  batchId: number;

  @IsString()
  @MaxLength(200)
  subject: string;

  @IsString()
  @MaxLength(2000)
  message: string;
}
