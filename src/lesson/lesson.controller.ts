import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';

import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/user/entities/user.entity';

import { LessonService } from './lesson.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { QueryLessonDto } from './dto/query-lesson.dto';

@Controller()
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Post('courses/:courseId/lessons')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.lessonService.create(courseId, dto);
  }

  @Get('courses/:courseId/lessons')
  findAll(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() query: QueryLessonDto,
  ) {
    return this.lessonService.findAll(courseId, query);
  }

  @Get('lessons/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.lessonService.findOne(id);
  }

  @Patch('lessons/:id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLessonDto) {
    return this.lessonService.update(id, dto);
  }

  @Delete('lessons/:id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.lessonService.remove(id);
  }

  @Patch('lessons/:id/publish')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.lessonService.publish(id);
  }

  @Patch('lessons/:id/unpublish')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  unpublish(@Param('id', ParseUUIDPipe) id: string) {
    return this.lessonService.unpublish(id);
  }

  @Patch('lessons/:id/reorder/:order')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  reorder(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('order', ParseIntPipe) order: number,
  ) {
    return this.lessonService.reorder(id, order);
  }
}
