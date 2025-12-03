import { IsOptional, IsString, IsUUID,MaxLength, MinLength } from "class-validator";


export class UpdateCommentDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    content?: string


    @IsOptional()
    @IsUUID()
    parentId?: string




}