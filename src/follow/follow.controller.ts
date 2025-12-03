import { Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { FollowService } from './follow.service';
import { CurrentUser } from 'src/common/decorators/current-user';
import type { UserPayLoad } from 'src/common/interfaces/all-interfaces';
import { JwtAuthGuard } from 'src/common/AuthGuard/JwtAuthGuard';
import { GetFollowers } from './dto/GetFollowersPaginated';

@Controller('follows')
export class FollowController {
    constructor(private readonly followService: FollowService) {}

    @UseGuards(JwtAuthGuard)
    @Post('/:userId/follower')
    followUser(@Param('userId') targetUserId: string,
     @CurrentUser() user: UserPayLoad
    ) {
        return this.followService.followUser(targetUserId,user)
    }

    @UseGuards(JwtAuthGuard)
    @Patch('/:followerId/accept-follower')
    acceptFollower(@Param('followerId') followerId: string,
    @CurrentUser() user: UserPayLoad) {
        return this.followService.acceptFollow(followerId,user)
    }

    @UseGuards(JwtAuthGuard)
    @Patch('/:followerId/decline-follower')
    declineFollower(@Param('followerId') followerId: string,
    @CurrentUser() user: UserPayLoad) {
        return this.followService.declineFollow(followerId,user)
    }


    @UseGuards(JwtAuthGuard)
    @Get('/my-followers')
    getFollowers(@Query() query: GetFollowers, @CurrentUser() user: UserPayLoad) {
        return this.followService.getFollowers(query,user)
    }

    @UseGuards(JwtAuthGuard)
    @Get('/is-following')
    getFollowing(@Query() query: GetFollowers, @CurrentUser() user: UserPayLoad) {
        return this.followService.getFollowing(query,user)
    }

    @UseGuards(JwtAuthGuard)
    @Delete('/:userId/follow')
    unfollowUser(@Param('userId') targetUserId: string,
    @CurrentUser() user: UserPayLoad
   ) {
      return this.followService.unfollowUser(targetUserId,user)
    }
    
}
