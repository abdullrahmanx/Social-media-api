import { Transform, Type } from "class-transformer";
import { IsIn, IsObject, IsOptional, IsString, Max, Min } from "class-validator";



export class PaginatedQueryDto {

    @IsOptional()
    @Type(() => Number)
    @Min(1)
    page?: number = 1

    @IsOptional()
    @Type(() => Number)
    @Min(1)
    @Max(100)
    limit?: number = 10


    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';


    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc'

    @IsOptional()
    @IsString()
    search?: string;


    @IsOptional()
    @IsObject()
    @Transform(({value}) => {
     if(!value) return {}
     if(typeof value === 'object') return value
     try {
        return JSON.parse(value)
     }catch(e) {
        return {}
     }   
    })
    filters?: Record<string,any>;


}