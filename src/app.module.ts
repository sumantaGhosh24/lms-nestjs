import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CourseModule } from './course/course.module';
import { LessonModule } from './lesson/lesson.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { databaseConfig } from './database';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    AuthModule,
    UserModule,
    CourseModule,
    LessonModule,
    EnrollmentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
