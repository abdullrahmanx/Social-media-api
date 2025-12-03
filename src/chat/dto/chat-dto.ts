import { Transform } from "class-transformer";
import { IsArray, IsBoolean, IsOptional, IsString, IsUUID, MaxLength, IsNumber,Min,Max, IsObject } from "class-validator";



export class CreateChatDto {

    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string

    @IsOptional()
    @IsBoolean()
    isGroup?: boolean  

    @IsOptional()
    @IsArray()
    @IsUUID('4', {each: true})
    membersId?: string[]

}

export class GetPaginatedDto {

        @IsOptional()
        @IsNumber()
        @Min(1)
        page?: number
    
        @IsOptional()
        @IsNumber()
        @Min(1)
        @Max(100)
        limit?: number
    
    
        @IsOptional()
        @IsString()
        sortBy?: string
    
        @IsOptional()
        @IsString()
        sortOrder?: 'asc' | 'desc' = 'desc'

        @IsOptional()
        @IsObject()
        @Transform(({value}) => JSON.parse(value))
        filters?: Record<string, any>

        @IsOptional()
        @IsString()
        search?: string


}


export class UpdateChatDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string

    @IsOptional()
    @IsUUID('4', {each: true})
    addMembersIds?: string[]

    @IsOptional()
    @IsUUID('4', {each: true})
    removeMembersIds?: string[]




}