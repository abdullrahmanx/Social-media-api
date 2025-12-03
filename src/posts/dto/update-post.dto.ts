import { Visibility } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsOptional,IsString,MaxLength, MinLength } from "class-validator";


export class UpdatePostDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(2000)
    content?: string

    @IsOptional()
    @IsEnum(Visibility)
    @Transform(({value}) => value.toUpperCase())
    visibility?: Visibility


}