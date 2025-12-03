import { IsNumber, IsOptional,Min,Max, IsString } from "class-validator";


export class GetLikesPaginated {

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
    sortOrder?: 'asc' | 'desc' = 'desc'

    @IsOptional()
    @IsString()
    sortBy?: string


}