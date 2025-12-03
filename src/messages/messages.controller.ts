import { Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from 'src/common/AuthGuard/JwtAuthGuard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateMessageDto, UpdateMessageDto } from './dto/message-dto';
import { CurrentUser } from 'src/common/decorators/current-user';
import { UserPayLoad } from 'src/common/interfaces/all-interfaces';
import { PaginatedQueryDto } from 'src/common/pagination/paginate.dto';

@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}


  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('message', 10))
  @Post('/messages')
  async createMessage(@Body() dto: CreateMessageDto, @CurrentUser() user: UserPayLoad,
  @UploadedFiles() files: Express.Multer.File[]) {
    return this.messagesService.createMessage(dto,user,files)
  }

  @UseGuards(JwtAuthGuard)
  @Get('/chats/:chatId/messages')
  async getMessages(@Param('chatId') chatId: string, @Query() query: PaginatedQueryDto,
  @CurrentUser() user: UserPayLoad) {
    return this.messagesService.getMessages(chatId,query,user)
  }

  @UseGuards(JwtAuthGuard)
  @Get('/messages/:id')
  async getMessage(@Param('id') id: string,@CurrentUser() user: UserPayLoad) {
    return this.messagesService.getMessage(id,user)
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('messages',10))
  @Put('/messages/:id')
  async updateMessage(@Param('id') id: string, @Body() dto: UpdateMessageDto,
  @CurrentUser() user: UserPayLoad, @UploadedFiles() files?: Express.Multer.File[]) {
    return this.messagesService.updateMessage(id,dto,user,files)
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/messages/:id')
  async deleteMessage(@Param('id') id: string,@Query('forAll') forAll: string,@CurrentUser() user: UserPayLoad) {
    const deletedForAll= forAll === 'true' 
    return this.messagesService.deleteMessage(id,deletedForAll,user)
  }

}
