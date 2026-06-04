import { IsString, MaxLength } from 'class-validator';

export class RespondDoubtDto {
  @IsString()
  @MaxLength(2000)
  response: string;
}
