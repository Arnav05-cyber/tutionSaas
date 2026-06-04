import { IsString, MaxLength } from 'class-validator';

export class RespondQueryDto {
  @IsString()
  @MaxLength(2000)
  response: string;
}
