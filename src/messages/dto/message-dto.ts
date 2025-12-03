import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";


export class CreateMessageDto {

    @IsOptional()
    @IsString()
    @MaxLength(500)
    content?: string


    @IsNotEmpty()
    @IsUUID()
    chatId: string


    @IsOptional()
    @IsUUID()
    replyToId: string

}

export class UpdateMessageDto {

    @IsOptional()
    @IsString()
    @MaxLength(500)
    content?: string
    

}

