import { IsNumber, IsOptional, Min, Max, IsString, IsDateString, IsUUID } from "class-validator";



export class GetPostsPaginated {
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
    search?: string

    @IsOptional()
    @IsString()
    content?: string

    @IsOptional()
    @IsUUID()
    userId?: string

    @IsOptional()
    @IsString()
    username?: string

    @IsOptional()
    @IsString()                             
    sortOrder?: 'asc' | 'desc' = 'desc'
    

    @IsOptional()
    @IsString()
    sortBy?: 'createdAt'

    @IsOptional()
    @IsDateString()
    postedFrom?: string

    @IsOptional()
    @IsDateString()
    postedTo?: string


}