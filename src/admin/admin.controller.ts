import {
  Controller,
  Get,
  Delete,
  Param,
  ParseUUIDPipe,
  Query,
  Patch,
  Body,
} from '@nestjs/common';

import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';

import { AdminService } from './admin.service';
import { AdminUserQueryDto } from './dto/user-query.dto';

@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly usersService: UserService,
    private readonly adminService: AdminService,
  ) {}

  @Get('dashboard')
  async dashboard() {
    return await this.adminService.getDashboard();
  }

  @Get('dashboard/stats')
  async stats() {
    return await this.adminService.getStats();
  }

  @Get('users')
  async users(@Query() query: AdminUserQueryDto) {
    return await this.usersService.findAll(query);
  }

  @Get('users/:id')
  async user(@Param('id', ParseUUIDPipe) id: string) {
    return await this.usersService.getUser(id);
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return await this.usersService.updateUserStatus(id, isActive);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return await this.usersService.deleteUser(id);
  }
}
