import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';

import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';

import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment.dto';

@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  async create(@CurrentUser() user: User, @Body() dto: CreateEnrollmentDto) {
    return this.enrollmentService.create(user.id, dto);
  }

  @Get('my')
  async findMyEnrollments(
    @CurrentUser() user: User,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.enrollmentService.findMyEnrollments(user.id, page, limit);
  }

  @Get('course/:courseId')
  async findByUserAndCourse(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
  ) {
    return this.enrollmentService.findByUserAndCourse(user.id, courseId);
  }

  @Get('course/:courseId/check')
  async checkEnrollment(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
  ) {
    const enrolled = await this.enrollmentService.isEnrolled(user.id, courseId);

    return {
      enrolled,
    };
  }

  @Get(':id')
  async findById(@CurrentUser() user: User, @Param('id') id: string) {
    return this.enrollmentService.findById(id, user.id);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateEnrollmentStatusDto,
  ) {
    return this.enrollmentService.updateStatus(id, user.id, dto);
  }

  @Patch(':id/complete')
  async complete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.enrollmentService.complete(id, user.id);
  }

  @Patch(':id/cancel')
  async cancel(@CurrentUser() user: User, @Param('id') id: string) {
    return this.enrollmentService.cancel(id, user.id);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.enrollmentService.remove(id, user.id);

    return {
      message: 'Enrollment deleted successfully',
    };
  }
}
