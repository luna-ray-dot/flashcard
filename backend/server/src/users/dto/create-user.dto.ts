import { IsString, IsEmail, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()

  readonly username!: string;

  readonly username!: string; // ✅ definite assignment assertion
main

  @IsEmail()
  readonly email!: string;

  @IsString()
  @MinLength(6)
  readonly password!: string;
}
