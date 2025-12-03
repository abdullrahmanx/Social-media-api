import {IsOptional,IsNotEmpty,MinLength,MaxLength,IsString, IsEmail, IsBoolean} from 'class-validator'

export class RegisterDto {



@IsNotEmpty()
@IsString()
@MinLength(3)
@MaxLength(20)
username!: string


@IsOptional()
@IsString()
@MinLength(3)
@MaxLength(20)
displayName?: string

@IsNotEmpty()
@IsEmail()
email!: string

@IsNotEmpty()
@IsString()
@MinLength(6)
@MaxLength(25)
password!: string

@IsOptional()
@IsBoolean()
isPrivate?: boolean





@IsOptional()
@IsString()
@MinLength(5)
@MaxLength(200)
bio?: string

}