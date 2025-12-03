import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserPayLoad } from 'src/common/interfaces/all-interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetFollowers } from './dto/GetFollowersPaginated';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';

@Injectable()
export class FollowService {
    constructor(private readonly prisma: PrismaService,
        private readonly notificationService: NotificationsService,
        private readonly notificationGateway: NotificationsGateway,
        
    ) {}


    async followUser(targetUserId: string,user: UserPayLoad) {
        
        const checkUser= await this.prisma.user.findUnique({
            where: {
                id: targetUserId
            }
        })
        if(!checkUser) {
            throw new NotFoundException('User not found')
        }
        

        if(user.id === targetUserId) {
            throw new BadRequestException('You cant follow yourself')
        }
        const existingFollow= await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: user.id,
                    followingId: targetUserId,
                }
            }
        })

        if(existingFollow) {
            throw new BadRequestException('You already follow this user')
        }

        const follow= await this.prisma.follow.create({
            data: {
                followerId: user.id,
                followingId: targetUserId,
                followStatus: checkUser.isPrivate ? 'PENDING' : 'APPROVED'
            },include: {
                following: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true
                    }
                }
            }
        })

        const notification= await this.notificationService.createNotification({
            type: 'FOLLOW',
            recipientId: targetUserId,
            senderId: user.id,
            followId: follow.id
        })

        this.notificationGateway.emitToUser(targetUserId,'notification:follow',notification)

        return {
            success: true,
            message: checkUser.isPrivate ? 'Follow request sent' : 'Followed successfully',
            data : follow
        }
    }
    async acceptFollow(followerId: string, user: UserPayLoad) {
        

        const follow= await this.prisma.follow.findUnique({
            where :{
                followerId_followingId: {
                    followerId,
                    followingId: user.id
                }
            }
        })

        if (!follow) throw new NotFoundException('Follow request not found');


        if (follow.followStatus !== 'PENDING') {
            throw new BadRequestException('This follow request cannot be approved');
        }

        const updatedFollow= await this.prisma.follow.update({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId: user.id
                }
            },
            data : {
                followStatus: 'APPROVED'
            }
        })

         return {
            success: true,
            message: 'Follow request accepted successfully',
            data: updatedFollow
        };
    }
    async declineFollow(followerId: string, user: UserPayLoad) {

        const follow= await this.prisma.follow.findUnique({
            where :{
                followerId_followingId: {
                    followerId,
                    followingId: user.id
                }
            }
        })
        if (!follow) throw new NotFoundException('Follow request not found');
        
        if (follow.followStatus !== 'PENDING') {
            throw new BadRequestException('This follow request cannot be declined');
        }

        await this.prisma.follow.delete({
            where : {
                followerId_followingId:{
                followerId,
                followingId: user.id
             }
            }
        })

        return {
            success: true,
            message: 'Follow request declined successfully',
        };
    }

    async getFollowing(query: GetFollowers,user: UserPayLoad) {
        const {
            page = 1,
            limit = 10,
            sortBy= 'createdAt',
            sortOrder
        }= query

        const skip= (page - 1) * limit

        const where: Record<string, string> = {followerId: user.id,followStatus: 'APPROVED'}

        const [followers,total] = await Promise.all([
            this.prisma.follow.findMany({
                where,
                skip,
                take: limit,
                orderBy: {[sortBy] : sortOrder},
                include: {
                    following: {
                        select: {
                            id: true,
                            displayName: true,
                            avatarUrl: true
                        }
                    }
                }
            }),
            this.prisma.follow.count({where})
        ])

        const totalPages= Math.ceil(total/limit)
        return {
            success: true,
            data: followers,
            pagination: {
                page,
                limit,
                total,
                prevPage: page > 1 ? page - 1 : null,
                nextPage: page < totalPages ? page + 1 : null,
                totalPages
            }
        }
    }
    async getFollowers(query: GetFollowers,user: UserPayLoad) {
        const {
            page = 1,
            limit = 10,
            sortBy= 'createdAt',
            sortOrder
        }= query

        const skip= (page - 1) * limit

        const where: Record<string, string> = {followingId: user.id, followStatus: 'APPROVED'}

        const [followers,total] = await Promise.all([
            this.prisma.follow.findMany({
                where,
                skip,
                take: limit,
                orderBy: {[sortBy] : sortOrder},
                include: {
                    follower: {
                        select: {
                            id: true,
                            displayName: true,
                            avatarUrl: true
                        }
                    }
                }
            }),
            this.prisma.follow.count({where})
        ])

        const totalPages= Math.ceil(total/limit)
        return {
            success: true,
            data: followers,
            pagination: {
                page,
                limit,
                total,
                prevPage: page > 1 ? page - 1 : null,
                nextPage: page < totalPages ? page + 1 : null,
                totalPages
            }
        }
    }

    async unfollowUser(targetUserId: string, user: UserPayLoad) {
        const existingFollow= await this.prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: user.id,
                    followingId: targetUserId
                }
            }
        })

        if(!existingFollow) {
            throw new BadRequestException('You are not following this user')
        }

        await this.prisma.follow.delete({
            where: {
                followerId_followingId: {
                    followerId: user.id,
                    followingId: targetUserId
                }
            }
        })

        return {
            success: true,
            message: 'Unfollowed successfully'
        }
    }
}
