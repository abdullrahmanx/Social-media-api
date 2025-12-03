import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UploadFiles, UserPayLoad } from 'src/common/interfaces/all-interfaces';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDto, UpdateMessageDto } from './dto/message-dto';
import { UploadApiResponse } from 'cloudinary';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { MediaType } from '@prisma/client';
import { PaginatedQueryDto } from 'src/common/pagination/paginate.dto';
import { getPaginatedData } from 'src/common/pagination/pagination';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';

@Injectable()
export class MessagesService {
    constructor(private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService,
        private readonly notificationService: NotificationsService,
        private readonly notificationGateway: NotificationsGateway
    ) {}


    async createMessage(dto: CreateMessageDto,user: UserPayLoad, files?: Express.Multer.File[]) {

        if(!dto.content && !files?.length) {
            throw new BadRequestException('At least one field is required')
        }
          
        const chat= await this.prisma.chat.findFirst({
            where: {
                id: dto.chatId,
                members: {
                    some: {
                        userId: user.id
                    }
                }
            },
            include: {
                members: true
            }
        })

        if(!chat) {
            throw new NotFoundException('Chat not found')
        }
       
        let uploadedFiles: UploadFiles[] = []
        if (files?.length) {
            uploadedFiles = await Promise.all(
                files.map(async file => {
                    const result = await this.cloudinaryService.uploadFile(file, 'messages') as UploadApiResponse;
                    return {
                        url: result.secure_url,
                        type: result.resource_type as MediaType
                    };
                })
            );
    }

        const message= await this.prisma.message.create({
            data: {
                chatId: dto.chatId,
                senderId: user.id,
                ...(dto.content !== undefined && {content: dto.content}),
                ...(uploadedFiles.length > 0 && {
                    media: {
                        create : uploadedFiles.map(file => ({
                            url: file.url,
                            type: file.type
                        }))
                    }
                })
            },
            include: {
                media: {
                    select: {
                        type: true,
                        url: true,
                    }
                },
                sender: {
                    select: {
                        id: true,
                        displayName: true,
                        username: true
                    }
                }
            }
        })
         const recipients= chat.members
            .filter(member => member.userId !== user.id)
            .map(member => member.userId)

        for(const recipientId of recipients) {
           const notification= await this.notificationService.createNotification({
                type: 'MESSAGE',
                recipientId,
                senderId: user.id,
                chatId: dto.chatId,
                messageId: message.id
            })
            this.notificationGateway.emitToUser(recipientId,'MESSAGE',notification)
        }
        return {
            success: true,
            message: 'Message sent successfully',
            data: message
        }
    }

    async getMessages(chatId: string,query: PaginatedQueryDto,user: UserPayLoad) {
        const chat= await this.prisma.chat.findFirst({
            where: {
                id: chatId,
                members: {
                    some: {
                        userId: user.id
                    }
                }
            }
        })

        if(!chat) {
            throw new NotFoundException('Chat not found')
        }

        const messages= await getPaginatedData(
            query,
            this.prisma,
            this.prisma.message,
            {
                allowedSortFields: ['createdAt','updatedAt','read'],
                searchableFields: ['content'],
                allowedFilters: ['content','read','isEdited'],
                extraWhere: {chatId}
            }
        )
        return messages

    }

    async getMessage(id: string,user: UserPayLoad) {
        const message= await this.prisma.message.findFirst({
            where: {
                id,
                chat: {
                    members: {
                        some: {
                            userId: user.id
                        }
                    }
                }
            },
            include: {
                chat: true
            }
        })

        return {
            success: true,
            data: message
        }
    }

    async updateMessage(id: string, dto: UpdateMessageDto ,user: UserPayLoad,
        files?: Express.Multer.File[]
    ) {

        const message= await this.prisma.message.findUnique({
            where: {
                id,
            },
            include: {
                chat: {
                    include: {
                        members: {
                            select: {
                                userId: true
                            }
                        }
                    }
                }
            }
        })

        if(!message) {
            throw new NotFoundException('Message not found')
        }
        if(user.role !== 'ADMIN' && message.senderId !== user.id) {
            throw new ForbiddenException("Only admin and message sender can edit")
        }
        if(!dto.content && !files?.length) {
            throw new NotFoundException('Nothing to update')
        }

        let uploadedFile: UploadFiles[] = []
        if(files && files?.length > 0) {
            uploadedFile= await Promise.all(
                files.map(async (file) => {
                    const result= await this.cloudinaryService.uploadFile(file,'messages')as UploadApiResponse
                    return {
                        url: result.secure_url,
                        type: result.resource_type as MediaType
                    }
                })
            )
        }

        const updatedMessage = await this.prisma.message.update({where: {id},
        data: {
            ...(dto.content && {content: dto.content}),
            isEdited: true,
            ...(uploadedFile.length > 0 && {
                media: {
                create: uploadedFile.map((file) => ({
                    url: file.url,
                    type: file.type
                }))
              }
            })
          },
        include: {
            chat: true,
            media: {
                select: {
                    url: true,
                    type: true
                }
            }
        }})

        return {
            success: true,
            message: 'Message updated successfully',
            data: updatedMessage
        }  
    }

    async deleteMessage(id: string,forAll: boolean,user: UserPayLoad) {
        const message= await this.prisma.message.findUnique({
            where: {id},
            include: {
                chat: {
                    select: {
                        members: {
                            select: {
                                userId: true
                            }
                        }
                    }
                }
            }
        })
        if(!message) {
            throw new NotFoundException('Message not found')
        }
        const senderOrAdmin= user.role == 'ADMIN' || message.senderId== user.id

        if(!senderOrAdmin && forAll) {
            throw new ForbiddenException('Only admin and sender can delete for all')
        }

        if(senderOrAdmin && forAll) {
            await this.prisma.message.delete({where: {id}})
            return {
                success: true,
                message: 'Message deleted for all'
            };
        }

        if(!forAll) {
            await this.prisma.message.update({where: {id},
            data: {
                deletedFor: {push: user.id}
            }})
            return {
                success: true,
                message: 'Message deleted successfully'
            }
        }
    }

}
