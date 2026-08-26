import { Module } from '@nestjs/common';

import { UserModule } from 'src/user/user.module';
import { EmailModule } from 'src/email/email.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [UserModule, EmailModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
