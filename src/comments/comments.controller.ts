import { Controller, UseGuards, Post,Get, Put,Delete, Param, Body, Query, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from 'src/common/AuthGuard/JwtAuthGuard';
import { CurrentUser } from 'src/common/decorators/current-user';
import type { UserPayLoad } from 'src/common/interfaces/all-interfaces';
import { CreateCommentDto } from './dto/create-comment-dto';
import { GetCommentsPaginated } from './dto/GetCommentsPaginated';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UpdateCommentDto } from './dto/update-comment-dto';

@Controller('comments')
export class CommentsController {
    constructor(private readonly commentService: CommentsService) {}

    @UseGuards(JwtAuthGuard)
    @Post('/post/:postId')
    @UseInterceptors(FilesInterceptor('comments',5))
    createComment(@Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: UserPayLoad, @UploadedFiles() files?: Express.Multer.File[])
    {
        return this.commentService.createComment(postId,dto,user,files)
    }

    @UseGuards(JwtAuthGuard)
    @Get('/post/:postId')
    getComments(@Param('postId') postId: string,
     @Query() query: GetCommentsPaginated,
     @CurrentUser() user: UserPayLoad) {
        return this.commentService.getComments(postId,query,user)
    }

    @UseGuards(JwtAuthGuard)
    @Get('/replies/:commentId')
    getCommentReplies(@Param('commentId') commentId: string,
    @Query() query: GetCommentsPaginated,
    @CurrentUser() user: UserPayLoad) {
        return this.commentService.getCommentReplies(commentId,query,user)
    }

    @UseGuards(JwtAuthGuard)
    @Put('/:commentId')
    @UseInterceptors(FilesInterceptor('comments',5))
    updateComment(@Param('commentId') commentId: string,@Body() dto: UpdateCommentDto,
    @CurrentUser() user: UserPayLoad, @UploadedFiles() files?: Express.Multer.File[]) {
      return this.commentService.updateComment(commentId,dto,user,files)
    }

    @UseGuards(JwtAuthGuard)
    @Delete('/:commentId')
    deleteComment(@Param('commentId') commentId: string,@CurrentUser() user: UserPayLoad) {
        return this.commentService.deleteComment(commentId,user)
    }
}

