import { BadRequestException, Injectable } from '@nestjs/common';
import { UserPayLoad } from 'src/common/interfaces/all-interfaces';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) {}

    async getUsers(user: UserPayLoad) {
        if(user.role !== 'ADMIN') {
            throw new BadRequestException('Admin role required')
        }
        const users= await this.prisma.user.findMany({
            select: {
                id : true,
                username: true,
                email: true
            }
        })

        return {
            success: true,
            data: users
        }
    }
}
