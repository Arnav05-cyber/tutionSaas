import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  IsEmail,
  MaxLength,
} from 'class-validator';

export class OnboardDto {
  @IsIn(['TEACHER', 'STUDENT', 'PARENT'])
  role: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  grade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  inviteToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  qualification?: string;

  @IsBoolean()
  consentGiven: boolean;
}
