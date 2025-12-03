import { BadRequestException, Injectable, NotFoundException, UnauthorizedException, UploadedFile } from '@nestjs/common';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UploadFiles, UserPayLoad } from 'src/common/interfaces/all-interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post-dto';
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import { GetPostsPaginated } from './dto/GetPostsPaginated';
import { UpdatePostDto } from './dto/update-post.dto';
import { MediaType } from '@prisma/client';


@Injectable()
export class PostsService {
    constructor(private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService
    ) {}

    async createPost( dto: CreatePostDto,user: UserPayLoad,files?: Express.Multer.File[]) {
        
        let uploadedFiles: UploadFiles[] = []
        if(files?.length) {
            uploadedFiles= await Promise.all(files.map(async (file) => {
                const result= await this.cloudinaryService.uploadFile(file, 'posts') as UploadApiErrorResponse
                return {
                    url: result.secure_url,
                    type: result.resource_type.toLowerCase()
                } as UploadFiles
            }))
        }

        const post= await this.prisma.post.create({
            data: {
                content: dto.content,
                visibility: dto.visibility,
                userId: user.id,
                ...(uploadedFiles.length > 0 && {media: {
                    create: uploadedFiles
                }})
            },
            include: {
                media: true,
                user: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarUrl: true
                    }
                }
            }
        })

        return {
            success: true,
            message: 'Post created successfully',
            data: post
        }
    }

    async getPosts( query: GetPostsPaginated) {
        const {
            page= 1,
            limit= 10,
            content,
            userId,
            username,
            sortOrder= 'desc',
            sortBy= 'createdAt',
            postedFrom,
            postedTo
        }= query

        const skip= (page - 1) * limit

        let where: any = {}

        if(content) {
            where.content= {contains: content,mode: 'insensitive'}
        }
        
        if(userId) {
            where.userId= userId
        }

        if(username) {
            const user= await this.prisma.user.findFirst({
               where:  {
                username: {
                    contains: username,
                    mode: 'insensitive'
                }
               }
            })
            if(user) {
                where.userId= user.id
            }
        }
       

        if(postedFrom || postedTo) {
            where.createdAt= {}
            if(postedFrom) {
                where.createdAt.gte= new Date(postedFrom)
            }
            if(postedTo) {
                where.createdAt.lte= new Date(postedTo)
            }
        }

        const [posts,total] = await Promise.all([
            this.prisma.post.findMany({
                where,
                take: limit,
                skip,
                orderBy: {[sortBy] : sortOrder},
                include: {
                    media: true,
                    user: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true
                        }
                    },
                    _count: {
                        select: {
                            likes: true,
                            comments: true
                        }
                    }
                }
            }),
            this.prisma.post.count({where})
        ])

        const totalPages= Math.ceil(total / limit)
        return {
            success: true,
            data: posts,
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

    async getPost(id: string, user?: UserPayLoad) {
        const post= await this.prisma.post.findUnique({
            where: {
                id
            },include: {
                media: true,
                user:  {
                    select: {
                        id: true,
                        displayName: true
                    }
                },
                _count: {
                  select: {
                    likes: true,
                    comments: true
                }
              }
            }
        })

        if(!post) {
            throw new NotFoundException('Post not found')
        }
        let liked= false
        if(user) {
            const like= await this.prisma.like.findUnique({
                where: {
                    userId_postId: {
                        userId: user?.id,
                        postId: id
                    }
                }
            })
            liked= !!like
        } 

        return {
            success: true,
            data: {...post,liked}
        }
    }

    async updatePost(id: string, dto: UpdatePostDto,user: UserPayLoad, files?: Express.Multer.File[]) {
        const post= await this.prisma.post.findFirst({
            where: {
                id,
                userId: user.id
            }
        })

        if(!post) {
            throw new NotFoundException('Post not found')
        }

        let uploadedFiles: UploadFiles[] = []
        if(files?.length) {
            uploadedFiles= await Promise.all(
                files.map(async (file) => {
                    const result= await this.cloudinaryService.uploadFile(file,'posts') as UploadApiResponse
                    return {
                        url: result.secure_url,
                        type: result.resource_type 
                    } as UploadFiles
                }) 
            )
        }


        if(dto.content === undefined && dto.visibility === undefined && uploadedFiles === undefined) {
            throw new BadRequestException('Nothing to update')
        }

        const updatePost= await this.prisma.post.update({
            where: {
                id
            },
            data : {
                ...(dto.content !== undefined && {content: dto.content}),
                ...(dto.visibility !== undefined && {visibility: dto.visibility}),
                ...(uploadedFiles.length && {media: {
                    create: uploadedFiles
                }})
            },
            include: {
                media: true,
                user: {
                    select: {
                        id: true,
                        displayName: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            }
        })

        return {
            success: true,
            message: 'Post updated successfully',
            data: updatePost
        }
    }

    async deletePost(id: string, user: UserPayLoad) {
        const post= await this.prisma.post.findUnique({
            where: {
                id
            }
        })
        if(!post) {
            throw new NotFoundException('Post not found')
        }

        if(post.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
            throw new UnauthorizedException('You can only delete your own posts')
        }
        
        const media= await this.prisma.media.findFirst({
            where: { postId: post.id }
        });

        if(!media) {
            throw new NotFoundException('Post media not found')
        }
        if(media.url) {
            const url= media.url.split('/')
            const fileName= url[url.length - 1]
            const public_id= `posts/${fileName.split('.')[0]}`
            await this.cloudinaryService.deleteFile(public_id,media.type as UploadFiles['type'])
        }

        await this.prisma.post.delete({
            where: {
                id
            }
        })
        return {
            success: true,
            message: 'Post deleted successfully'
        }
    }
}
