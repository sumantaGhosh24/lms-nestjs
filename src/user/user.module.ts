import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from 'src/database';

import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { Course } from '../course/entities/course.entity';
import { Enrollment } from '../enrollment/entities/enrollment.entity';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([User, Course, Enrollment]),
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
