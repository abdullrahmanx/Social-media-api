import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/common/AuthGuard/JwtAuthGuard';
import { CurrentUser } from 'src/common/decorators/current-user';
import { UserPayLoad } from 'src/common/interfaces/all-interfaces';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}


  @UseGuards(JwtAuthGuard)
  @Get('/users')
  async getUsers(@CurrentUser() user: UserPayLoad) {
    return this.adminService.getUsers(user)
  }
}
