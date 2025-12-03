import { Visibility } from '@prisma/client'
import { Transform } from 'class-transformer'
import {IsNotEmpty, IsString,MinLength,MaxLength, IsEnum} from  'class-validator'


export class CreatePostDto {
    
    @IsNotEmpty()
    @IsString()
    @MinLength(1)
    @MaxLength(2000)
    content!: string

    @IsNotEmpty()
    @IsEnum(Visibility)
    @Transform(({value}) => value.toUpperCase())
    visibility!: Visibility
    
}