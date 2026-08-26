import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    const port = Number(this.configService.get('MAIL_PORT'));
    const secure =
      String(this.configService.get('MAIL_SECURE')).toLowerCase() === 'true';

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port,
      secure,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  async onModuleInit() {
    try {
      await this.transporter.verify();

      this.logger.log('Mail server connection verified successfully');
    } catch (error) {
      this.logger.error('Mail server connection failed', error);
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    try {
      const appUrl = this.configService.get<string>('APP_URL');
      const verificationUrl = `${appUrl}/api/auth/verify-email?token=${token}`;

      const result: unknown = await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM'),
        to: email,
        subject: 'Verify your email',
        html: `
            <h2>Welcome! Please verify your email</h2>
            <p>Click the link below to verify your email address. This link expires in 24 hours.</p>
            <a href="${verificationUrl}">Verify Email</a>
            <p>If you didn't create an account, you can safely ignore this email.</p>
        `,
      });

      this.logger.log('Email sent successfully');

      return result;
    } catch (error) {
      this.logger.error('Failed to send email', error);

      throw new InternalServerErrorException('Failed to send email');
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    try {
      const appUrl = this.configService.get<string>('APP_URL');
      const resetUrl = `${appUrl}/api/auth/reset-password?token=${token}`;

      const result: unknown = await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM'),
        to: email,
        subject: 'Reset your password',
        html: `
            <h2>Password Reset Request</h2>
            <p>Click the link below to reset your password. This link expires in 1 hour.</p>
            <a href="${resetUrl}">Reset Password</a>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
        `,
      });

      this.logger.log('Email sent successfully');

      return result;
    } catch (error) {
      this.logger.error('Failed to send email', error);

      throw new InternalServerErrorException('Failed to send email');
    }
  }
}
