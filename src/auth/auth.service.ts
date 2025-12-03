import { BadRequestException,UnauthorizedException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register-dto';
import { LoginDto } from './dto/login-dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto'
import { sendEmail } from 'src/common/utils/email';
import { ForgotPassowrdDto } from './dto/forgot-password-dto';
import { ResetPasswordDto } from './dto/reset-password-dto';
import { ChangePasswordDto } from './dto/change-password-dto';
import { UserPayLoad } from 'src/common/interfaces/all-interfaces';



@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService,
        private jwtService: JwtService
    ) {}

    generateTokens(id: string, username: string, role: string) {
        const accessToken= this.jwtService.sign({
            id,
            username,
            role
        }, {
            secret: process.env.JWT_ACCESS,
            expiresIn: '7d'
        })
        
        const refreshToken= this.jwtService.sign({
            id
        },
        {
            secret: process.env.JWT_REFRESH,
            expiresIn: '7d'
        })
        return {accessToken,refreshToken}
    }


    async register(dto: RegisterDto) {
        const existingUser= await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        })
        if(existingUser) {
            throw new BadRequestException('Email already registered')
        }

        const verifiyToken= crypto.randomBytes(32).toString('hex')
        const verificationToken= crypto.createHash('sha256').update(verifiyToken).digest('hex')
        const verificationTokenExpires= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
        const hashPass= await bcrypt.hash(dto.password,10)

        const newUser= await this.prisma.user.create({
            data: {
                username: dto.username,
                displayName: dto.displayName  || dto.username,
                email: dto.email,
                password: hashPass,
                bio: dto.bio,
                isPrivate: dto.isPrivate,
                verificationToken,
                verificationTokenExpires
            }
        })
        const tokens= this.generateTokens(newUser.id, newUser.username, newUser.role)

        const url= `${process.env.FRONTEND_URL}/auth/verify-email?token=${verifiyToken}`
        //await sendEmail(newUser.email,'verification',{name: newUser.username, url})

        
        const user= await this.prisma.user.update({
            where: {
                id: newUser.id
            },
            data: {
                refreshToken: await bcrypt.hash(tokens.refreshToken,10)
            }
        })

        return {
            success: true,
            message: 'User created successfully, please verify your account',
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                isPrivate: user.isPrivate
            },
            tokens
        }
    }

    async verifyEmail(token: string) {
        
        if(!token) {
            throw new BadRequestException('Token is required')
        }

        const hashToken= crypto.createHash('sha256').update(token).digest('hex')

        const user= await this.prisma.user.findFirst({
            where: {
                verificationToken: hashToken,
                verificationTokenExpires: {gt: new Date()}
            }
        })
        if(!user) {
            throw new NotFoundException('User not found')
        }

        await this.prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                verified: true,
                verificationToken: null,
                verificationTokenExpires: null
            }
        })
        return {
            success: true,
            message: 'Email verified successfully'
        }
    }

  
    async login(dto: LoginDto) {
        const {email,password} = dto

        const user= await this.prisma.user.findUnique({where: {email}})
        if(!user) throw new UnauthorizedException('Email or password is incorrect')

        const isPasswordValid= await bcrypt.compare(password,user.password)
        if (!isPasswordValid) throw new UnauthorizedException('Email or password is incorrect');

        // if(!user.verified) {
        //   throw new  UnauthorizedException('Email verification is required');
        // }
        const tokens = await this.generateTokens(user.id,user.username,user.role)
        await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    refreshToken: await bcrypt.hash(tokens.refreshToken,10),
                },
        });
        return {
            success: true,
            message: 'Login successfully',
            data: {
                id: user.id,
                displayName: user.displayName
            },
            tokens
        }

    }

    async refreshToken(refreshToken: string, id: string) {
        const user= await this.prisma.user.findUnique({
            where: {id}
        })

        if(!user || !user.refreshToken) {
            throw new UnauthorizedException('Access denied')
        }
        const isValid= await bcrypt.compare(refreshToken,user.refreshToken)
        if(!isValid) {
            throw new UnauthorizedException('Invalid token or expired')
        }
        
        
        const tokens= this.generateTokens(user.id,user.username,user.role)

        await this.prisma.user.update({
            where: {
                id: user.id
            },
            data :{
                refreshToken: await bcrypt.hash(tokens.refreshToken,10)
            }
        })
    
        return {
            success: true,
            data: tokens
        }
    }
    
    async logout(id: string) {

        await this.prisma.user.update({
            where: { id },
            data: {
                refreshToken: null 
            }
        });
        return {
            success: true,
            message: 'Logged out successfully'
        };
    }


    async forgotPassword(dto: ForgotPassowrdDto): Promise<{success: boolean,message: string}> {
        
        const user= await this.prisma.user.findFirst({where: {email: dto.email}})
      
        if (!user) {
            return {success: true,message: 'If email exists a reset password link will be sent to your email'}
        }
        
        const token= crypto.randomBytes(32).toString('hex')

        const hashedToken= crypto.createHash('sha256').update(token).digest('hex')

        const resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000) 

        const url = `${process.env.FRONTEND_URL}/auth/reset-password/${token}`

        await sendEmail(user.email,'password',{name: user.username,url})

        console.log(token)

        await this.prisma.user.update({where: {email: dto.email},
        data: {
            resetPasswordExpires,
            resetPasswordToken: hashedToken
        }})
        return {
            success: true,
            message: 'If email exists a reset password link will be sent to your email'
        }
    }

    async resetPassword(dto: ResetPasswordDto,token: string): Promise<{success: boolean,message: string}> {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

        const user= await this.prisma.user.findFirst({where: {
            resetPasswordToken : hashedToken,
            resetPasswordExpires: {gt : new Date()}
        }})
        
        if(!user) throw new NotFoundException('User not found')
        
        const newPassHashed= await bcrypt.hash(dto.newPassword,10)
        
        await this.prisma.user.update({where: {id: user.id},
        data: {
            password: newPassHashed,
            resetPasswordToken : null,
            resetPasswordExpires: null,
            refreshToken: null,
            refreshTokenExpires: null
        }})
        return {
            success: true,
            message: 'Passowrd reset done, please login with your new password'
        }
    }
    
    async changePassword(dto: ChangePasswordDto,user: UserPayLoad): Promise<{success: boolean,message: string}> {
        const existingUser= await this.prisma.user.findUnique({where: {id: user.id}})

        if(!existingUser) throw new NotFoundException('User not found')

        if(dto.currentPassword === dto.newPassword) {
            throw new BadRequestException('Current password and new password cannot be equal')
        }    
        const currentPassHash= await bcrypt.compare(dto.currentPassword,existingUser.password)  

        if(!currentPassHash) throw new BadRequestException('Current password is incorrect')

            
        const newPassHash= await bcrypt.hash(dto.newPassword,10) 

        const tokens= this.generateTokens(user.id,user.name,user.role)

        await this.prisma.user.update({where: {id: user.id},

        data: {
            password: newPassHash,
            refreshToken: await bcrypt.hash(tokens.refreshToken,10)
        }})   

        return {
            success: true,
            message: 'Password changed successfully, please login with your new password'}
    }
    
}
