import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateChatDto, GetPaginatedDto, UpdateChatDto } from './dto/chat-dto';
import { UserPayLoad } from 'src/common/interfaces/all-interfaces';
import { contains } from 'class-validator';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UploadApiResponse } from 'cloudinary';
import { PaginatedQueryDto } from 'src/common/pagination/paginate.dto';
import { getPaginatedData } from 'src/common/pagination/pagination';

@Injectable()
export class ChatService {
    constructor(private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService
    ) {}


    async createChat(dto: CreateChatDto, user: UserPayLoad, file?: Express.Multer.File) {
        let chat: any

        if(!dto.membersId) {
            throw new BadRequestException('Chat members are required')
        }

        
        let uploadImage: Record<string, string>
        if (dto.membersId.length && dto.membersId.length > 1) {
            const users = await this.prisma.user.findMany({
                where: {
                    id: {
                        in: dto.membersId
                    }
                }
            })

            if (users.length !== dto.membersId.length) {
                throw new BadRequestException('Some users not found')
            }
            if(file) {
                uploadImage= await this.cloudinaryService.uploadFile(file,'group') as UploadApiResponse
            }    
            chat = await this.prisma.chat.create({
                data: {
                    isGroup: true,
                    ...(dto.name !== undefined && { name: dto.name }),
                    ...(uploadImage && {chatImg: uploadImage.secure_url}),
                    members: {
                        create: [
                            { userId: user.id },
                            ...(dto.membersId.map(id => ({ userId: id })))
                        ]
                    },
                    chatOwnerId: user.id
                }, include: {
                    members: true
                }
            })
        } else if( dto.membersId && dto.membersId.length === 1) {
            chat = await this.prisma.chat.create({
                data: {
                    isGroup: false,
                    members: {
                        create: [
                            { userId: user.id },
                            ...(dto.membersId.map(userId => ({ userId })))
                        ]
                    }
                }
            })
        }
        return {
            success: true,
            message: 'Chat created successfully',
            data: {
                chat
            }
        }
    }

    async getChats(query: PaginatedQueryDto, user: UserPayLoad) {
        const extraWhere= {
            OR: [
                {chatOwnerId: user.id},
                {members: {some: {userId: user.id}}}
            ]
        }
        const chats= await getPaginatedData(
            query,
            this.prisma,
            this.prisma.chat,
            {
                allowedSortFields: ['createdAt','updatedAt','isGroup','name'],
                searchableFields: ['name'],
                allowedFilters: ['name','isGroup'],
                extraWhere
            }
        )
        return chats
    }

    async getChat(id: string, user: UserPayLoad) {
        const chat = await this.prisma.chat.findUnique({
            where: {
                id
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                displayName: true,
                                avatarUrl: true
                            }
                        }
                    }
                },
                messages: {
                    take: 20,
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        if (!chat) {
            throw new NotFoundException('Chat not found')
        }
        return {
            success: true,
            data: chat
        }
    }

    

    async updateChat(id: string, dto: UpdateChatDto, user: UserPayLoad, file?: Express.Multer.File) {
        const chat = await this.prisma.chat.findUnique({
            where: { id },
            include: { members: true }
        });

        if (!chat) {
            throw new NotFoundException('Chat not found');
        }

        const isMember = chat.members.some(member => member.userId === user.id);

        if (user.role !== 'ADMIN' && !isMember) {
            throw new ForbiddenException('You cant edit this chat');
        }

    
        if (!chat.isGroup) {
            const updatedChat = await this.prisma.chat.update({
                where: { id },
                data: { ...(dto.name !== undefined && { name: dto.name }) },
                include: {
                    members: {
                        include: {
                            user: { select: { id: true, displayName: true, username: true } }
                        }
                    }
                }
            });
            
            return { success: true, message: 'Chat updated successfully', data: updatedChat };
        }

    
        if (user.role !== 'ADMIN' && chat.chatOwnerId !== user.id) {
            throw new ForbiddenException('You cannot edit this chat');
        }

        let newMembers: string[] = [];
        let uploadImage: UploadApiResponse | undefined;

        if (file) {
            uploadImage = await this.cloudinaryService.uploadFile(file, 'group') as UploadApiResponse;
        }

        if (dto.addMembersIds?.length) {
            const users = await this.prisma.user.findMany({
                where: { id: { in: dto.addMembersIds } }
            });

            if (users.length !== dto.addMembersIds.length) {
                throw new BadRequestException('Some users are not found');
            }

            const existingMemberIds = chat.members.map(member => member.userId);
            newMembers = dto.addMembersIds.filter(id => !existingMemberIds.includes(id));
        }

        if (dto.removeMembersIds?.length) {
            const users = await this.prisma.user.findMany({
                where: { id: { in: dto.removeMembersIds } }
            });

            if (users.length !== dto.removeMembersIds.length) {
                throw new BadRequestException('Some users are not found');
            }

            await this.prisma.chatMember.deleteMany({
                where: { chatId: id, userId: { in: dto.removeMembersIds } }
            });
        }

        const updatedChat = await this.prisma.chat.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(uploadImage?.secure_url && { chatImg: uploadImage.secure_url }),
                ...(newMembers.length > 0 && {
                    members: { create: newMembers.map(id => ({ userId: id })) }
                })
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, displayName: true, username: true } }
                    }
                }
            }
        });

        return { success: true, message: 'Chat updated successfully', data: updatedChat };
    }


    async deleteChat(id: string, user: UserPayLoad) {

        const chat = await this.prisma.chat.findUnique({
            where: {
                id
            },
            include: {
                members: true
            }
        })
        if (!chat) {
            throw new NotFoundException('Chat not found')
        }

        const isMember = chat.members.some(member => member.userId === user.id)
        if (!isMember) {
            throw new ForbiddenException('You cannot delete this chat')
        }

        if (chat.isGroup) {
            if (user.role !== 'ADMIN' && chat.chatOwnerId !== user.id) {
                throw new ForbiddenException('You cannot delete this chat')
            }
            if(chat.chatImg) {
                const url= chat.chatImg.split('/')
                const index= url[url.length - 1]
                const public_id= `group/${index.split('.')[0]}`
                await this.cloudinaryService.deleteFile(public_id,'image')
            }
            await this.prisma.chat.delete({
                where: {
                    id
                }
            })
        } else {
            await this.prisma.chat.update({
                where: {
                    id
                },
                data: {
                    deletedFor: {push: user.id}
                }
            })
        }
        return {
            success: true,
            message: 'Chat deleted successfully'
        }
    }
}
