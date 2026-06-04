import { IsString, MaxLength } from 'class-validator';

export class CreateQueryDto {
  @IsString()
  @MaxLength(200)
  subject: string;

  @IsString()
  @MaxLength(2000)
  message: string;
}
