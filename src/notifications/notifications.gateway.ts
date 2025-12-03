import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { GetNotificationsPaginated, NotificationData } from 'src/common/interfaces/all-interfaces';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    
    private logger: Logger= new Logger(NotificationsGateway.name);
    private userSockets= new Map<string, Set<string>>();

    constructor(private readonly jwtService: JwtService,
        private readonly notificationService: NotificationsService
    ) {}

    async handleConnection(client: Socket, ...args: any[]) {
        try {
            const token= client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1]

            if(!token) {
                this.logger.warn(`Unauthorized connection attempt from ${client.id}`)
                return client.disconnect()
            }

            const payload= this.jwtService.verify(token, {secret: process.env.JWT_ACCESS})

            if(!this.userSockets.has(payload.id)) {
                this.userSockets.set(payload.id, new Set())
            }
            this.userSockets.get(payload.id).add(client.id)
        

            this.logger.log(`User ${payload.id} connected with socket ID: ${client.id}`)

            client.emit('connected', {message: 'Successfully connected to notifications gateway'})
        }catch(error) {
            this.logger.error(`Connection error: ${error.message}`)
            client.disconnect()
        }
    }

    async handleDisconnect(client: Socket) {
        for(const [userId, sockets] of this.userSockets.entries()) {
            if(sockets.has(client.id)) {

                sockets.delete(client.id)

                if(sockets.size === 0) {
                    this.userSockets.delete(userId)
                }
                this.logger.log(`User ${userId} disconnected from socket ID: ${client.id}`)
                break
            }
        }
    }

    @SubscribeMessage('notifications:get')
    async handleGetAllUserNotifications(
        @ConnectedSocket() client: Socket,
        @MessageBody() query: GetNotificationsPaginated
    ) {
        const userId= this.getUserId(client)
        const notifications= await this.notificationService.getUserNotifications(query,userId)
        return {event: 'notifications:get', data: notifications}
    }

    @SubscribeMessage('notifications:getUnread')
    async handleGetUnreadCounts(
        @ConnectedSocket() client: Socket
    ) {
        const userId= this.getUserId(client)
        const unreadCount= await this.notificationService.getUnreadCounts(userId)
        return {event: 'notifications:getUnread', data: unreadCount}
    }

    @SubscribeMessage('notifications:markAsRead')
    async handleMarkAsRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() notificationId: string
    ) {
    
    const userId = this.getUserId(client)
    
    const markAsRead = await this.notificationService.markAsRead(notificationId, userId)
    
    this.emitToUser(userId, 'notifications:markAsRead', markAsRead)
    
    return { event: 'notifications:markAsRead', data: markAsRead }
    
   }

   
    @SubscribeMessage('notifications:markAllAsRead')
    async handleMarkAllAsRead(
        @ConnectedSocket() client: Socket
    ) {
        const userId= this.getUserId(client)
        const markAllAsRead= await this.notificationService.markAllAsRead(userId)
        this.emitToUser(userId,'notifications:markAllAsRead',markAllAsRead)
        return {event: 'notifications:markAllAsRead', data: markAllAsRead}
    }

    @SubscribeMessage('notifications:deleteNotification')
    async handleDeleteNotification(
        @ConnectedSocket() client: Socket,
        @MessageBody() notificationId: string
    ) {
        const userId= this.getUserId(client)
        const deleteNotificaiton= await this.notificationService.deleteNotificaiton(notificationId,userId)
        return {event: 'notifications:deleteNotification', data: deleteNotificaiton}
    }

    @SubscribeMessage('notifications:deleteAllNotification')
    async handleAllNotifications(
        @ConnectedSocket() client: Socket
    ) {
        const userId=   this.getUserId(client)
        const deleteAllNotifications= await this.notificationService.deleteAllNotifications(userId)
        return {event: 'notifications:deleteAllNotification', data: deleteAllNotifications}
    }


    private getUserId(client: Socket): string {
        for(const [userId, sockets] of this.userSockets.entries()) {
            if(sockets.has(client.id)) return userId
        }
        throw new WsException('Unauthorized')
    }
    
     emitToUser(userId: string, event: string, data: any) {
        const socket= this.userSockets.get(userId)
        if (!socket) {
            return; 
        }
        socket.forEach((socketId) => this.server.to(socketId).emit(event,data))    
    }

}




