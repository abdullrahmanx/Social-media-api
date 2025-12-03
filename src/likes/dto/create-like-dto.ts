import { IsOptional, IsUUID } from "class-validator";


export class CreateLikeDto {

    @IsOptional()
    @IsUUID()
    postId?: string

    @IsOptional()
    @IsUUID()
    commentId?: string


}