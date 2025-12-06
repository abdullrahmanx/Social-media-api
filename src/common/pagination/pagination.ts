import { Prisma, PrismaClient } from "@prisma/client"
import { PaginatedQueryDto } from "./paginate.dto";



export async function getPaginatedData(
    query: PaginatedQueryDto,
    prisma: PrismaClient,
    model: any,
    options: {
        allowedSortFields?: string[],
        searchableFields?: string[],
        allowedFilters?: string[],
        extraWhere?: Record<string,any>,
        include?: Record<string, any> 
    }
) {
    const {
        page = 1,
        limit= 10,
        sortBy= 'createdAt',
        sortOrder= 'desc',
        search,
        filters: queryFilters
    }= query
    const {
        allowedSortFields= [],
        allowedFilters= [],
        searchableFields= [],
        extraWhere= {},
        include= {}
    }= options

    const skip = (page - 1) * limit

    const validSort=  allowedSortFields.length > 0 && !allowedSortFields.includes(sortBy) ?
    'createdAt'
    : sortBy

    const searchCondtions= search && searchableFields.length > 0 ?
    {
        OR: searchableFields.map((field) => ({
            [field]: {contains: search, mode: 'insensitive' as const}
        }))
    }: {}

    const filters: Record<string, any>= {}
    if(queryFilters) {
        for(const [key,value] of Object.entries(queryFilters)) {
            if(typeof value === 'string') {
                filters[key]= value
            } else if (typeof value === 'number' || typeof value === 'boolean') {
                filters[key]= {equals: value}
            } else if(Array.isArray(value)) {
                filters[key]= {in: value}
            } else {
                filters[key]= value
            }
        }
    }
    const whereParts: Record<string,any>= []

    if(Object.keys(filters).length > 0) {
        whereParts.push(filters)
    }
    if(Object.keys(searchCondtions).length > 0) {
        whereParts.push(searchCondtions)
    }
    if(Object.keys(extraWhere).length > 0) {
        whereParts.push(extraWhere)
    }

    const where= whereParts.length > 1 ?
    {AND: whereParts}
    : whereParts.length === 1 ?
    whereParts[0]
    : {}
    const [data, total]= await prisma.$transaction([
        model.findMany({
            where,
            take: limit,
            skip,
            orderBy: {[validSort]: sortOrder},
            include: include
        }),
        model.count({where})
    ])

    const totalPages = Math.ceil(total / limit)

    return {
        data: data ,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            prevPage: page > 1 ? page - 1 : null,
            nextPage: page < totalPages ? page + 1 : null
        }
    }
}

