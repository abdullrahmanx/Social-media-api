import { IsEmail,IsOptional,MinLength,MaxLength } from "class-validator";

export class UpdateProfileDto {

    @IsOptional()
    @IsEmail()
    email?: string 

    @IsOptional()
    @MinLength(3)
    @MaxLength(10)
    displayName?: string

    @IsOptional()
    @MinLength(3)
    @MaxLength(10)
    username?: string

    @IsOptional()
    password?: string

  
}