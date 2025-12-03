import { Controller,Query,Post,Get,Put,Body, Param, BadRequestException, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register-dto';
import { LoginDto } from './dto/login-dto';
import { JwtService } from '@nestjs/jwt';
import type { UserPayLoad } from 'src/common/interfaces/all-interfaces';
import { CurrentUser } from 'src/common/decorators/current-user';
import { ForgotPassowrdDto } from './dto/forgot-password-dto';
import { ResetPasswordDto } from './dto/reset-password-dto';
import { ChangePasswordDto } from './dto/change-password-dto';
import { JwtAuthGuard  } from 'src/common/AuthGuard/JwtAuthGuard';
import { ApiOperation, ApiResponse, ApiTags,ApiBody,ApiBearerAuth,ApiParam } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';


@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService,
        private jwtService: JwtService
    ) {}

    @Throttle({medium : {limit: 3, ttl: 3600000}})
    @Post('/register')
     register(@Body() dto: RegisterDto) {
        return this.authService.register(dto)
    }

    @Throttle({medium: {limit: 5, ttl: 3600000}})
    @Get('verify-email')
    verifyEmail(@Query('token') token: string) {
        return this.authService.verifyEmail(token);
    }

    @Throttle({strict: {limit: 5, ttl: 60000}})
    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto)
    } 
    
    
    @Throttle({strict: {limit: 10, ttl: 60000}})
    @Post('/refresh-token')
     refreshToken(@Body('refreshToken') refreshToken: string) {
         if(!refreshToken) {
            throw new BadRequestException('Refresh token is required')
        }
        let payload: Record<string, string>

        try {
        payload= this.jwtService.verify(refreshToken,{secret: process.env.JWT_REFRESH})

        }catch(err){
            throw new UnauthorizedException('Invalid token')
        }

        return this.authService.refreshToken(refreshToken,payload.id)
    }

    
    @SkipThrottle()
    @Post('/logout')
    @UseGuards(JwtAuthGuard)
     logout(@CurrentUser() user: UserPayLoad) {
        return this.authService.logout(user.id)
    }  

    
    @Throttle({strict: {limit: 3, ttl: 3600000}})
    @Post('forgot-password')
     forgotPassword(@Body() dto: ForgotPassowrdDto) {
        return this.authService.forgotPassword(dto)
    }

   
    @Throttle({medium: {limit: 3,ttl: 3600000}})
    @Post('reset-password/:token')
     resetPassword(@Body() dto: ResetPasswordDto, @Param('token') token: string) {
        return this.authService.resetPassword(dto,token)
    }  

    @UseGuards(JwtAuthGuard)
    @Throttle({medium: {limit: 3,ttl: 360000}})
    @Put('change-password')
     changePassword(@Body() dto: ChangePasswordDto,@CurrentUser() user: UserPayLoad) {
        return this.authService.changePassword(dto,user)
    } 

}
