import { BadRequestException, NotFoundException,Injectable } from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service'
import { GetNotificationsPaginated, GetPaginatedResponse, NotificationContent, NotificationData, UserPayLoad } from 'src/common/interfaces/all-interfaces';
import { NotificationType } from '@prisma/client';
import { NotificationsGateway } from './notifications.gateway';
import { GetLikesPaginated } from 'src/likes/dto/GetLikesPaginated';



@Injectable()
export class NotificationsService {
    constructor(private readonly prisma: PrismaService
       
    ) {}

    async createNotification(data: NotificationData) {
        if(data.recipientId === data.senderId) {
            throw new BadRequestException('You cant create notifications to yourself')
        }
        const existing= await this.prisma.notification.findFirst({
            where: {
                type: data.type,
                recipientId: data.recipientId,
                senderId: data.senderId,
                postId: data.postId,
                commentId: data.commentId,
                likeId: data.likeId,
                followId: data.followId,
                chatId: data.chatId,
                createdAt: {
                    gte: new Date(Date.now()  - 24 * 60 * 60 * 1000)
                }                

            }
        })

        if(existing) {
            return existing
        }

        return  await this.prisma.notification.create({
            data: {
                type: data.type,
                recipientId: data.recipientId,
                senderId: data.senderId,
                postId: data.postId,
                commentId: data.commentId,
                likeId: data.likeId, 
                chatId: data.chatId,
                followId: data.followId,
            }, include: {
                sender: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true
                    }
                }
            }
        })

    }

     async getUserNotifications(query: GetNotificationsPaginated,userId: string):
     Promise<GetPaginatedResponse<NotificationContent>> {
        const {
            page= 1,
            limit= 10,
            sortBy= 'createdAt',
            sortOrder= 'desc',
            readOnly= false
        }= query

        const skip= (page - 1) * limit

        const allowedSort= ['createdAt', 'read']

        if(!allowedSort.includes(sortBy)) {
            throw new BadRequestException(`Invalid sort field, Allowed: ${allowedSort.join(', ')}`)
        }

        const where: any= {recipientId: userId}
        if(readOnly) {
            where.read= false
        }

       const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    sender: {
                        select : {
                            id: true,
                            displayName: true,
                            avatarUrl: true
                        }
                    },
                    post: {
                        select: {
                            id: true,
                            content: true,
                            media: true
                        }
                    }, comment: {
                        select: {
                            id: true,
                            content: true
                        }
                    },
                    like: {
                        select : { 
                            id: true,

                        }
                    },
                    follow: {
                        select: {
                            id: true,
                        }
                    }
                }
            }),
            this.prisma.notification.count({ where })
        ])
          const totalPages = Math.ceil(total / limit)

        return {
            data: notifications,
            total,
            page,
            limit,
            prevPage: page > 1 ? page - 1 : null,
            nextPage: page < totalPages ? page + 1: null,
            totalPages
        }
    }

    async markAsRead(notificationId: string, userId: string)  {

        const existing= await this.prisma.notification.findFirst({
            where: {
                id: notificationId,
                recipientId: userId
            }
        })
        
        if (!existing) {
            throw new Error('Notification not found');
        }

        if(existing.read) {
            return existing
        }

        return await this.prisma.notification.update({where: {
            id: notificationId
        },
        data: {
            read: true
        }})
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: {
                recipientId: userId,
                read: false
            },
            data: {
                read: true
            }
        })
    }

    async getUnreadCounts(userId: string) {
        return await this.prisma.notification.count({where: {
            recipientId: userId,
            read: false
        }})
    }

    async deleteNotificaiton(notificationId: string, userId: string) {
        const notification= await this.prisma.notification.findUnique({
            where: {
            id: notificationId,
            recipientId: userId
          }
        })
        if (!notification) {
            throw new NotFoundException('Notification not found')
        }

        return this.prisma.notification.delete({
            where: {
                id: notificationId,
            }
        })
    }

    async deleteAllNotifications(userId: string) {
        return await this.prisma.notification.deleteMany({
            where: {
                recipientId: userId
            }
        })
    }
}
