import { Body, Controller, Post,Get,Put,Delete,Param, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post-dto';
import { CurrentUser } from 'src/common/decorators/current-user';
import type { UserPayLoad } from 'src/common/interfaces/all-interfaces';
import { JwtAuthGuard } from 'src/common/AuthGuard/JwtAuthGuard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { GetPostsPaginated } from './dto/GetPostsPaginated';
import { UpdatePostDto } from './dto/update-post.dto';
import { OptionalAuthGuard } from 'src/common/AuthGuard/OptionalGuard';

@Controller('posts')
export class PostsController {
    constructor(private readonly postService: PostsService) {}

    @UseGuards(JwtAuthGuard)
    @Post('/')
    @UseInterceptors(FilesInterceptor('posts'))
    createPost(@Body() dto: CreatePostDto, @CurrentUser() user: UserPayLoad,
       @UploadedFiles() files?: Express.Multer.File[]    
    ) {
        return this.postService.createPost(dto,user,files)
    }

    @Get('/')
    getPosts(@Query() query: GetPostsPaginated) {
        return this.postService.getPosts(query)
    }

    @UseGuards(OptionalAuthGuard)
    @Get('/:id')
    getPost(@Param('id') id: string, @CurrentUser() user?: UserPayLoad) {
        return this.postService.getPost(id,user)
    }

    @UseGuards(JwtAuthGuard)
    @Put('/:id')
    @UseInterceptors(FilesInterceptor('posts'))
    updatePost(@Param('id') id: string,@Body() dto: UpdatePostDto ,@CurrentUser() user: UserPayLoad,
    @UploadedFiles() files?: Express.Multer.File[]) {
        return this.postService.updatePost(id,dto,user,files)
    }

    @UseGuards(JwtAuthGuard)
    @Delete('/:id')
    deletePost(@Param('id') id: string, @CurrentUser() user: UserPayLoad) {
        return this.postService.deletePost(id,user)
    }   
}
