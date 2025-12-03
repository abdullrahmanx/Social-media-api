import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";


export class GetFollowers {
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



}