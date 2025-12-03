import { Controller,Body,UseGuards,Get,Put,Delete, UseInterceptors, UploadedFiles, Param, } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/AuthGuard/JwtAuthGuard';
import { CurrentUser } from 'src/common/decorators/current-user';
import { UpdateProfileDto } from './dto/update-user-dto';
import { DeleteUserDto } from './dto/delete-user-dto';
import type { UserPayLoad } from 'src/common/interfaces/all-interfaces';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { OptionalAuthGuard } from 'src/common/AuthGuard/OptionalGuard';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) {}

    @SkipThrottle()
    @UseGuards(JwtAuthGuard)
    @Get('me')
    getMyProfile(@CurrentUser() user: UserPayLoad) {
        return this.userService.getMyProfile(user)
    }

    @SkipThrottle()
    @UseGuards(OptionalAuthGuard)
    @Get('/:id')
    getProfile(@Param('id') id: string,
    @CurrentUser() user?: UserPayLoad
    ) {
        return this.userService.getProfile(id,user)
    }


    @Throttle({medium: {limit: 5, ttl: 3600000}})
    @UseGuards(JwtAuthGuard)
    @Put('me')
    @UseInterceptors(FileFieldsInterceptor([
        {name: 'avatar', maxCount: 1},
        {name: 'cover', maxCount: 1}
    ]))
    updateProfile (@Body() dto: UpdateProfileDto,
    @CurrentUser() user: UserPayLoad,
    @UploadedFiles() files: {avatar?: Express.Multer.File[], cover?: Express.Multer.File[]}) {
        return this.userService.updateProfile(dto,user,files)
    }


    @SkipThrottle()
    @UseGuards(JwtAuthGuard)
    @Delete('/me')
    deleteUser(@Body() dto: DeleteUserDto,@CurrentUser() user: UserPayLoad) {
        return this.userService.deleteUser(dto,user)
    }
}
