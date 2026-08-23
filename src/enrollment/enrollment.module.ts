import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from 'src/database';

import { EnrollmentService } from './enrollment.service';
import { EnrollmentController } from './enrollment.controller';
import { Enrollment } from './entities/enrollment.entity';
import { User } from '../user/entities/user.entity';
import { Course } from '../course/entities/course.entity';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Enrollment, User, Course]),
  ],
  controllers: [EnrollmentController],
  providers: [EnrollmentService],
})
export class EnrollmentModule {}
