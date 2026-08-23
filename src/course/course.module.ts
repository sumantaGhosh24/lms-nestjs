import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from 'src/database';

import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { Course } from './entities/course.entity';
import { User } from '../user/entities/user.entity';
import { Lesson } from '../lesson/entities/lesson.entity';
import { Enrollment } from '../enrollment/entities/enrollment.entity';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Course, User, Lesson, Enrollment]),
  ],
  controllers: [CourseController],
  providers: [CourseService],
})
export class CourseModule {}
