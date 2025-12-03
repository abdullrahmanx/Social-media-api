import { Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto, GetPaginatedDto, UpdateChatDto } from './dto/chat-dto';
import { CurrentUser } from 'src/common/decorators/current-user';
import { UserPayLoad } from 'src/common/interfaces/all-interfaces';
import { JwtAuthGuard } from 'src/common/AuthGuard/JwtAuthGuard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @Post('/')
  createChat(@Body() dto: CreateChatDto,@CurrentUser() user: UserPayLoad,
  @UploadedFile() file?: Express.Multer.File) {
    return this.chatService.createChat(dto,user,file)
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  async getChat(@Param('id') id: string, @CurrentUser() user: UserPayLoad) {
    return this.chatService.getChat(id,user)
  }

  @UseGuards(JwtAuthGuard)
  @Get('/')
  async getChats(@Query() query: GetPaginatedDto, @CurrentUser() user: UserPayLoad) {
    return this.chatService.getChats(query,user)
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @Put('/:id')
  async updateChat(@Param('id') id: string,@Body() dto: UpdateChatDto,@CurrentUser() user: UserPayLoad,
  @UploadedFile() file?: Express.Multer.File) {
    return this.chatService.updateChat(id,dto,user,file)
  }


  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  async deleteChat(@Param('id') id: string, @CurrentUser() user: UserPayLoad) {
    return this.chatService.deleteChat(id,user)
  }


}
