import { Injectable } from '@nestjs/common';
import { DeleteUserDto } from './dto/delete-user-dto';
import { UpdateProfileDto } from './dto/update-user-dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserPayLoad } from 'src/common/interfaces/all-interfaces';
import { NotFoundException,BadRequestException,UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs'
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UploadApiResponse } from 'cloudinary';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService,
        private cloudinaryService: CloudinaryService
    ) {}

     async getMyProfile(user: UserPayLoad) {
        const userProfile= await this.prisma.user.findUnique({where: {id: user.id},
        select : {
            id: true,
            username: true,
            displayName: true,
            email: true,
            avatarUrl: true,
            coverImageUrl: true,
            _count: {
                select: {
                    followers: true,
                    following: true,
                    posts: true
                }
            }

        },
    })

        if(!userProfile) throw new NotFoundException('User not found')
        return {
                success: true,
                data: userProfile
                }

    }

     async getProfile(id: string,user?: UserPayLoad) {
        const userProfile= await this.prisma.user.findUnique({where: {id},
        select : {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            coverImageUrl: true,
            _count: {
                select: {
                    followers: true,
                    following: true,
                    posts: true
                }
            }

        },
    })

        if(!userProfile) throw new NotFoundException('User not found')
        return{
            success: true,
            data: userProfile    
        }    
    }

     async updateProfile(dto: UpdateProfileDto, user: UserPayLoad,
         files?: {avatar?: Express.Multer.File[], cover?: Express.Multer.File[]})
        {   
            const updateUser= await this.prisma.user.findUnique({where: {id: user.id}})
            if(!updateUser) throw new NotFoundException('User not found')
        
            const updatedFields: Record<string, string | null>= {}    
            if(dto.username) updatedFields.username= dto.username
            if(dto.displayName) updatedFields.displayName= dto.displayName

            if(dto.email) {
                const existingUser= await this.prisma.user.findUnique({
                    where: {email: dto.email}
                })
                if(existingUser) {
                    throw new BadRequestException('Email already in use')
                }
                if(!dto.password) throw new BadRequestException('Password is required')
                const checkPass= await bcrypt.compare(dto.password, updateUser.password)
                if(!checkPass) throw new UnauthorizedException('Incorrect password')
                updatedFields.email = dto.email    
            }

            if(files?.avatar?.length) {
                try {
                    const avatarFile= files.avatar[0]
                    const uploadAvatar= await this.cloudinaryService.uploadFile(avatarFile,'avatar') as UploadApiResponse
                    if(uploadAvatar.secure_url) {
                        updatedFields.avatarUrl= uploadAvatar.secure_url
                    }
                }catch(err) {
                    console.log('Error uploading avatar>>>', err)
                    throw new BadRequestException('Error uploading')
                }
            }
            
            if(files?.cover?.length) {
                try {
                    const coverFile= files.cover[0]
                    const uploadCover= await this.cloudinaryService.uploadFile(coverFile,'cover') as UploadApiResponse
                    if(uploadCover.secure_url) {
                        updatedFields.coverImageUrl= uploadCover.secure_url
                    }
                }catch(err) {
                    console.log('Error uploading cover>>>', err)
                    throw new BadRequestException('Error uploading')
                }
            }   


            const updatedUser= await this.prisma.user.update({where: {id: updateUser.id},
                data: updatedFields,
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    email: true,
                    avatarUrl: true,
                    coverImageUrl: true
                }
            })
            return {success: true, message: 'Profile updated successfully',data: updatedUser}
    }

     async deleteUser(dto: DeleteUserDto,user: UserPayLoad) {

        const deleteUser= await this.prisma.user.findUnique({where: {id: user.id}})
        if(!deleteUser) throw new NotFoundException('User not found')

        const checkPass= await bcrypt.compare(dto.password,deleteUser.password)    
        if(!checkPass) throw new UnauthorizedException('Incorrect password')
         
        if(deleteUser.avatarUrl) {
            const url= deleteUser.avatarUrl.split('/')
            const avatarName= url[url.length - 1]
            const avatarPublicId= `avatar/${avatarName.split('.')[0]}`
            await this.cloudinaryService.deleteFile(avatarPublicId,'image')
        }
        if(deleteUser.coverImageUrl) {
            const url= deleteUser.coverImageUrl.split('/')
            const coverImage= url[url.length -1]
            const coverPublic_id= `cover/${coverImage.split('.')[0]}`
            await this.cloudinaryService.deleteFile(coverPublic_id,'image')
        }

        await this.prisma.user.delete({where: {id: user.id}})

        return { success: true, message: 'User deleted successfully' };    

    }


}
