import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { LikesModule } from './likes/likes.module';
import { FollowModule } from './follow/follow.module';
import { PrismaModule } from './prisma/prisma.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import {ConfigModule} from '@nestjs/config'
import { ChatModule } from './chat/chat.module';
import { AdminModule } from './admin/admin.module';
import { MessagesModule } from './messages/messages.module';
import { ThrottlerGuard,ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 10
      },
      {
        name: 'medium',
        ttl: 3600000,
        limit: 10
      },
      {
        name: 'strict',
        ttl: 60000,
        limit: 5
      }
    ]),
    ConfigModule.forRoot({
      isGlobal: true
    })
    ,AuthModule, UsersModule, PostsModule, CommentsModule, LikesModule, FollowModule,PrismaModule, CloudinaryModule, ChatModule, AdminModule, MessagesModule],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ],
})
export class AppModule {}


