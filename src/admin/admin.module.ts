import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from 'src/user/user.module';
import { DatabaseModule } from 'src/database';
import { User } from 'src/user/entities/user.entity';
import { Course } from 'src/course/entities/course.entity';
import { Lesson } from 'src/lesson/entities/lesson.entity';
import { Enrollment } from 'src/enrollment/entities/enrollment.entity';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    UserModule,
    DatabaseModule,
    TypeOrmModule.forFeature([User, Course, Lesson, Enrollment]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
