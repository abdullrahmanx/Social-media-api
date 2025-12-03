import { Body, Controller, Param, Post,Get,Delete, Query, UseGuards } from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from 'src/common/AuthGuard/JwtAuthGuard';
import { CreateLikeDto } from './dto/create-like-dto';
import type { UserPayLoad } from 'src/common/interfaces/all-interfaces';
import { CurrentUser } from 'src/common/decorators/current-user';
import { GetLikesPaginated } from './dto/GetLikesPaginated';

@Controller()
export class LikesController {
    constructor(private readonly likesService: LikesService) {}

    @UseGuards(JwtAuthGuard)
    @Post('likes')
    createLike(@Body() dto : CreateLikeDto, @CurrentUser() user: UserPayLoad) {
        return this.likesService.createLike(dto,user)
    }

    @UseGuards(JwtAuthGuard)
    @Get('posts/:postId/likes')
    getPostLikes(@Param('postId') postId: string , @Query() query: GetLikesPaginated,@CurrentUser() user: UserPayLoad) {
        return this.likesService.getPostLikes(postId,query,user)
    }

    @UseGuards(JwtAuthGuard)
    @Get('comments/:commentId/likes')
    getCommentLikes(@Param('commentId') commentId: string , @Query() query: GetLikesPaginated,@CurrentUser() user: UserPayLoad) {
        return this.likesService.getCommentLikes(commentId,query,user)
    }

    @UseGuards(JwtAuthGuard)
    @Delete('posts/:postId/likes')
    deletePostLike(@Param('postId') postId: string, @CurrentUser() user: UserPayLoad) {
        return this.likesService.deletePostLike(postId,user)
    }

    @UseGuards(JwtAuthGuard)
    @Delete('comments/:commentId/likes')
    deleteCommentLike(@Param('commentId') commentId: string, @CurrentUser() user: UserPayLoad) {
        return this.likesService.deleteCommentLike(commentId,user)
    }
}
