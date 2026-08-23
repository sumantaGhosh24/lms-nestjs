import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from 'src/database';

import { LessonService } from './lesson.service';
import { LessonController } from './lesson.controller';
import { Lesson } from './entities/lesson.entity';
import { Course } from '../course/entities/course.entity';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([Lesson, Course])],
  controllers: [LessonController],
  providers: [LessonService],
})
export class LessonModule {}
