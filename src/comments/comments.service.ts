import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UploadFiles, UserPayLoad } from 'src/common/interfaces/all-interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment-dto';
import { NotFoundException } from '@nestjs/common';
import { GetCommentsPaginated } from './dto/GetCommentsPaginated';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UploadApiErrorResponse } from 'cloudinary';
import { UpdateCommentDto } from './dto/update-comment-dto';
@Injectable()
export class CommentsService {
    constructor(private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService
    ) {}

    async createComment(postId: string,dto: CreateCommentDto ,user: UserPayLoad,
        files?: Express.Multer.File[]
    ) {

        const post= await this.prisma.post.findUnique({
            where: {
                id: postId
              }
            })
        if(!post) {
            throw new NotFoundException('Post not found')
        }

        let uploadFiles: UploadFiles[] = []
        if(files?.length) {
           uploadFiles= await Promise.all(files.map(async(file) => {
                const result = await this.cloudinaryService.uploadFile(file,'comments') as UploadApiErrorResponse
                return {
                    url: result.secure_url,
                    type: result.resource_type
                } as UploadFiles
            }))
        }

        if(dto.parentId) {
            const parentComment= await this.prisma.comment.findUnique({
                where: {
                    id: dto.parentId
                }
            })
            if(!parentComment) {
                throw new NotFoundException('Comment not found')
            }
            if(parentComment.postId !== postId) {
                throw new BadRequestException('Reply must belong to the same post')
            }
        }


        const comment= await this.prisma.comment.create({
            data: {
                content: dto.content,
                postId: postId,
                userId: user.id,
                parentId: dto.parentId,
                media: {
                    create: uploadFiles
                }
            },
            include: {
                media: true
            }
        })

        return {
            success: true,
            message: 'Comment created successfully',
            data: comment
        }
    }

    async getComments(postId: string,query: GetCommentsPaginated,_user: UserPayLoad) {

       const post = await this.prisma.post.findUnique({ where: { id: postId } });
       if (!post) {
            throw new NotFoundException('Post not found');
        }

        const {
            page= 1,
            limit= 10,
            sortBy= 'createdAt',
            sortOrder,
            search
        } = query

        const skip= (page - 1) * limit

        const where: any = {postId}
        if(search) {
            where.content= {contains: search, mode: 'insensitive'}
        }
        const allowedSorts= ['createdAt', 'updatedAt']
        if(!allowedSorts.includes(sortBy)) {
            throw new BadRequestException('Invalid sort type')
        }

        const [comments,total]= await Promise.all([
            this.prisma.comment.findMany({where,
                skip,
                take: limit,
                orderBy: {[ sortBy]: sortOrder},
                include: {
                    user: {
                        select: {
                            id: true,
                            displayName: true,
                            avatarUrl: true
                        }
                    },
                    media: true,
                    _count: {
                        select : {
                            likes: true
                        }
                    }
                }
            }),
            this.prisma.comment.count({where})
        ])
        

        const totalPages= Math.ceil(total/limit)
        return {
            success: true,
            data: comments,
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



    async getCommentReplies(commentId: string, query: GetCommentsPaginated,_user: UserPayLoad) {
        const {
            page= 1,
            limit= 10,
            sortBy= 'createdAt',
            sortOrder,
            search
        } = query
        const skip= (page - 1) * limit

        const parent= await this.prisma.comment.findUnique({
            where : {
                id: commentId
            }
        })

        if(!parent) {
            throw new BadRequestException('Comment not found')
        }

        const [replies,total]= await Promise.all([this.prisma.comment.findMany({where: {
                parentId: commentId,
                content: {
                    contains: search, mode: 'insensitive'
                }
                },
                take: limit,
                skip,
                orderBy: {[sortBy]: sortOrder}
            }),
            this.prisma.comment.count({
                where: {
                    parentId: commentId
                }
            })]) 
        const totalPages= Math.ceil(total/limit)
          return {
            success: true,
            data: replies,
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

    
    async updateComment(commentId: string,
        dto: UpdateCommentDto,
        user: UserPayLoad,
        files?: Express.Multer.File[]
    ){
            const comment= await this.prisma.comment.findUnique({
                where: {
                    id: commentId
                }
            })

            if(!comment) {
                throw new NotFoundException('Comment not found')
            }

            if(comment.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
                throw new UnauthorizedException('You cant edit this comment')
            }
        
            let uploadedFiles:  UploadFiles[] = []
            if(files?.length) {
                uploadedFiles= await Promise.all(
                    files.map(async(file) => {
                     const result= await this.cloudinaryService.uploadFile(file,'comments') as UploadApiErrorResponse
                        return {
                            url: result.secure_url,
                            type: result.resource_type
                       }
                    })
                )
            }

            if(!dto.content && !files?.length) {
                throw new BadRequestException('Nothing to update')
            }

            const updatedComment= await this.prisma.comment.update({
                where: {
                    id: commentId
                },
                data: {
                    ...(dto.content !== undefined && {content: dto.content}),
                    updatedAt: new Date(),
                    media: {
                        create: uploadedFiles
                    }
                },
                include: {
                    media: true
                }
            })
            return {
                success: true,
                message: 'Comment updated successfully',
                data: updatedComment
            }
    }

    async deleteComment(commentId: string, user: UserPayLoad) {
        const comment= await this.prisma.comment.findUnique({
            where: {
                id: commentId
            },include: {
                media: true
            }
        })

        if(!comment) {
            throw new NotFoundException('Comment not found')
        }

        if(comment.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
            throw new UnauthorizedException('You cant delete this comment')
        }
        const replies= await this.prisma.comment.findMany({
            where: {
                parentId: commentId
            },include: {
                media: true
            }
        })

        if(!replies) {
            throw new NotFoundException('Replies not found')
        }

        const allComments= [comment,...replies]

        try {
            for(const c of allComments) {
                if(c.media.length) {
                    for(const media of c.media ) {
                        const url= media.url.split('/')
                        const fileName= url[url.length - 1]
                        const public_id= `comments/${fileName.split('.')[0]}`
                        await this.cloudinaryService.deleteFile(public_id,media.type)
                    }
                }
            }
        }catch (err) {
            console.log('Error deleting files', err);
            throw new BadRequestException('Error deleting files');
        }
        await this.prisma.comment.delete({
            where: {
                id: commentId
            }
        })
        return {
             success: true,
             message: 'Comment deleted successfully' 
            };
    }
}
