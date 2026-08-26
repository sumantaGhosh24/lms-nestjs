import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';

import { Roles } from 'src/auth/decorators/roles.decorator';
import { User, UserRole } from 'src/user/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  create(@Body() createCourseDto: CreateCourseDto, @CurrentUser() user: User) {
    return this.courseService.create(createCourseDto, user.id);
  }

  @Get()
  findAll(@Query() query: QueryCourseDto) {
    return this.courseService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.courseService.findOne(id, user.id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string, @CurrentUser() user: User) {
    return this.courseService.findBySlug(slug, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @CurrentUser() user: User,
  ) {
    return this.courseService.update(id, updateCourseDto, user.id);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string, @CurrentUser() user: User) {
    return this.courseService.publish(id, user.id);
  }

  @Patch(':id/unpublish')
  unpublish(@Param('id') id: string, @CurrentUser() user: User) {
    return this.courseService.unpublish(id, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.courseService.remove(id, user.id);
  }
}
