import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserPayLoad } from 'src/common/interfaces/all-interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLikeDto } from './dto/create-like-dto';
import { GetLikesPaginated } from './dto/GetLikesPaginated';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';
@Injectable()
export class LikesService {
    constructor(private readonly prisma: PrismaService,
        private readonly notificationService: NotificationsService,
        private readonly notificationGateway: NotificationsGateway
    ) {}

    async createLike( dto: CreateLikeDto, user: UserPayLoad) {

        if(!dto.commentId && !dto.postId) {
            throw new BadRequestException('Post or comment id required')
        }
        if(dto.postId && dto.commentId) {
            throw new BadRequestException('You can only like a post or a comment at a time')
        }
        let like: any
        let likeCount: any
        if(dto.postId) {
            const post= await this.prisma.post.findUnique({
            where: {
                id: dto.postId
            }
        })
            if(!post) {
                throw new NotFoundException('Post not found')
            }

            const existing= await this.prisma.like.findUnique({
                where: {
                    userId_postId: {
                        userId: user.id,
                        postId: dto.postId
                    }
                }
            })
            if(existing) {
                throw new BadRequestException('Already liked this post')
            }

            like= await this.prisma.like.create({
                data: {
                    userId: user.id,
                    postId: dto.postId
                }
            })
            if(post.userId !== user.id) {
                const notification= await this.notificationService.createNotification({
                type: 'LIKE',
                recipientId: post.userId,
                senderId: user.id,
                postId: dto.postId,
                likeId: like.id
            })
            this.notificationGateway.emitToUser(post.userId,'notification:like',notification)
          }
            likeCount= await this.prisma.like.count({where: {postId: dto.postId}})
        }
        if(dto.commentId) {
            const comment= await this.prisma.comment.findUnique({
                where: {
                    id: dto.commentId
                }
            })

            if(!comment) {
                throw new NotFoundException('Comment not found')
            }

            const existing= await this.prisma.like.findUnique({
                where: {
                    userId_commentId: {
                        userId: user.id,
                        commentId: dto.commentId
                    }
                }
            })

            if(existing) {
                throw new BadRequestException('You already likes this comment')
            }
            
            like= await this.prisma.like.create({
                data: {
                    commentId: dto.commentId,
                    userId: user.id
                }
            })
            if(like.userId !== user.id) {
                const notification = await this.notificationService.createNotification({
                    type: 'LIKE',
                    recipientId: like.userId,
                    senderId: user.id,
                    commentId: dto.commentId,
                    likeId: like.id,
                })
                this.notificationGateway.emitToUser(comment.userId, 'notification:like', notification)
            }
            likeCount= await this.prisma.like.count({where: {commentId: dto.commentId}})
        }

        return {
            success: true,
            message: 'Like created successfully',
            data: like,
            likeCount
        }
    }
    async getPostLikes(postId: string, query: GetLikesPaginated,_user: UserPayLoad) {

        const post= await this.prisma.post.findUnique({
            where: {
                id: postId
            }
        })

        if(!post) {
            throw new NotFoundException('Post not found')
        }

        const {
            page=1,
            limit=10,
            sortBy='createdAt',
            sortOrder= 'desc',
        }= query

        const skip = (page - 1) * limit

        const allowedSorts= ['createdAt']
        if(!allowedSorts.includes(sortBy)) {
            throw new BadRequestException('Invalid sort field');
        }

        const [likes,total]= await Promise.all([
            this.prisma.like.findMany({
                where: {
                    postId
                },
                skip,
                take: limit,
                orderBy: {[sortBy] : sortOrder},
                include: {
                    user: {
                        select: {
                            id: true,
                            displayName: true,
                            avatarUrl: true
                        }
                    }
                }
            }),
            this.prisma.like.count({where: {postId}})
        ])
        const totalPages= Math.ceil(total/limit)

        return {
            success: true,
            data: likes,
            pagination: {
                page,
                limit,
                total,
                prevPage: page > 1 ? page - 1 : null,
                nextPage: page<totalPages ? page + 1 : null,
                totalPages
            }
        }
    }
    async getCommentLikes(commentId: string, query: GetLikesPaginated,_user: UserPayLoad) {

        const comment= await this.prisma.comment.findUnique({
            where: {
                    id: commentId
              } 
            })

        if(!comment) {
            throw new NotFoundException('Comment not found')
        }

        const {
            page=1,
            limit=10,
            sortBy='createdAt',
            sortOrder= 'desc',
        }= query

        const skip = (page - 1) * limit

        const allowedSorts= ['createdAt']
        if(!allowedSorts.includes(sortBy)) {
            throw new BadRequestException('Invalid sort field');
        }

        const [likes,total]= await Promise.all([
            this.prisma.like.findMany({
                where: {
                    commentId
                },
                skip,
                take: limit,
                orderBy: {[sortBy] : sortOrder},
                include: {
                    user: {
                        select: {
                            id: true,
                            displayName: true,
                            avatarUrl: true
                        }
                    }
                }
            }),
            this.prisma.like.count({where: {commentId}})
        ])
        const totalPages= Math.ceil(total/limit)

        return {
            success: true,
            data: likes,
            pagination: {
                page,
                limit,
                total,
                prevPage: page > 1 ? page - 1 : null,
                nextPage: page<totalPages ? page + 1 : null,
                totalPages
            }
        }
    }

    async deletePostLike(postId: string, user: UserPayLoad) {
        const post= await this.prisma.post.findUnique({
            where: {
                id: postId
            }
        })
        if(!post) {
            throw new NotFoundException('Post not found')
        }

        const like= await this.prisma.like.findUnique({
            where: {
                userId_postId: {
                    userId: user.id,
                    postId
                }
            }
        })
        if(!like) {
            throw new BadRequestException('You didnt like this post')
        }

        await this.prisma.like.delete({
            where: {
                id: like.id
            }
        })
        return {
            success: true,
            message: 'Like removed successfully'
        }
    }
    async deleteCommentLike(commentId: string, user: UserPayLoad) {
        const comment= await this.prisma.comment.findUnique({
            where: {
                id: commentId
            }
        })
        if(!comment) {
            throw new NotFoundException('Post not found')
        }

        const like= await this.prisma.like.findUnique({
            where: {
                userId_commentId: {
                    userId: user.id,
                    commentId
                }
            }
        })
        if(!like) {
            throw new BadRequestException('You didnt like this post')
        }

        await this.prisma.like.delete({
            where: {
                id: like.id
            }
        })
        return {
            success: true,
            message: 'Like removed successfully'
        }
    }
}
