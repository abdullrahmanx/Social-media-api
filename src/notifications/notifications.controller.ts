import { Body, Controller, Post, Get,Delete,Put,Query, UseGuards, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { GetNotificationsPaginated, NotificationData, UserPayLoad } from 'src/common/interfaces/all-interfaces';
import { JwtAuthGuard } from 'src/common/AuthGuard/JwtAuthGuard';
import { CurrentUser } from 'src/common/decorators/current-user';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Post('/')
    async createNotifications(@Body() data: NotificationData) {
        return this.notificationsService.createNotification(data)
    }

    @UseGuards(JwtAuthGuard)
    @Get('/')
    async getNotifications(@Query() query : GetNotificationsPaginated,
    @CurrentUser() user: UserPayLoad) {
        return this.notificationsService.getUserNotifications(query,user.id)
    }

    @UseGuards(JwtAuthGuard)
    @Get('/unread')
    async getUnReadCount(@CurrentUser() user: UserPayLoad) {
        return this.notificationsService.getUnreadCounts(user.id)
    }
    

    @UseGuards(JwtAuthGuard)
    @Put('/:notificationId/mark-read')
    async markAsRead(@Param('notificationId') notificationId: string,
    @CurrentUser() user: UserPayLoad) {
        return this.notificationsService.markAsRead(notificationId,user.id)
    }

    @UseGuards(JwtAuthGuard)
    @Put('/mark-allread')
    async markAllAsRead(@CurrentUser() user: UserPayLoad) {
        return this.notificationsService.markAllAsRead(user.id)
    }
    
    @UseGuards(JwtAuthGuard)
    @Delete('/:notificationId')
    async deleteNotification(@Param('notificationId') notificationId: string,
    @CurrentUser() user: UserPayLoad) {
        return this.notificationsService.deleteNotificaiton(notificationId,user.id)
    }

    @UseGuards(JwtAuthGuard)
    @Delete('/')
    async deleteAllNotification(@CurrentUser() user: UserPayLoad) {
        return this.notificationsService.deleteAllNotifications(user.id)
    }
}
