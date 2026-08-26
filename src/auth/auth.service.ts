import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
  OnModuleInit,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import type { CookieOptions, Response } from 'express';
import type { StringValue } from 'ms';

import { UserService } from 'src/user/user.service';
import { EmailService } from 'src/email/email.service';
import { User } from 'src/user/entities/user.entity';

import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import { hashToken } from './utils/hash-token';
import { assertJwtSecrets, getRequiredSecret } from './utils/jwt-secrets';

const DUMMY_PASSWORD_HASH = bcrypt.hashSync('__timing_dummy__', 12);

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit() {
    assertJwtSecrets(this.configService);
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    );

    const user = await this.usersService.create({
      email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: passwordHash,
      verificationToken: hashToken(verificationToken),
      verificationTokenExpiresAt,
    });

    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        verificationToken,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${user.email}`,
        error,
      );
    }

    return {
      message:
        'Registration Successful. Please check your email to verify your account',
    };
  }

  async verifyEmail(token: string, res: Response) {
    const user = await this.usersService.findByVerificationToken(
      hashToken(token),
    );

    if (!user || !user.verificationToken) {
      throw new BadRequestException('Invalid verification token');
    }

    if (
      user.verificationTokenExpiresAt &&
      user.verificationTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException(
        'Verification token has expired. Please request a new one',
      );
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    await this.usersService.update(user.id, {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null,
    });

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      message: 'Email verified successfully. you are now logged in',
      accessToken: tokens.accessToken,
      user: this.toSafeUser(user),
    };
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.usersService.findByEmail(dto.email);

    const passwordHash = user?.password ?? DUMMY_PASSWORD_HASH;
    const passwordMatch = await bcrypt.compare(dto.password, passwordHash);

    if (!user || !passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      user: this.toSafeUser(user),
    };
  }

  async refresh(refreshToken: string | undefined, res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    let payload: { sub: string; email: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: getRequiredSecret(this.configService, 'JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!user.isActive || !user.isVerified) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenMatch = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );

    if (!tokenMatch) {
      await this.usersService.update(user.id, { refreshTokenHash: null });
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
    };
  }

  async logout(userId: string, res: Response) {
    await this.usersService.update(userId, { refreshTokenHash: null });

    res.clearCookie('refresh_token', this.getRefreshCookieOptions(0));
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(email: string) {
    const genericMessage = {
      message:
        'If an account with that email exists, a reset link has been sent.',
    };

    const user = await this.usersService.findByEmail(email);

    if (!user || !user.isActive) {
      return genericMessage;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.usersService.update(user.id, {
      resetToken: hashToken(resetToken),
      resetTokenExpiresAt,
    });

    try {
      await this.emailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${user.email}`,
        error,
      );
    }

    return genericMessage;
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByResetToken(hashToken(token));

    if (!user || !user.resetToken) {
      throw new BadRequestException('Invalid reset token');
    }

    if (user.resetTokenExpiresAt && user.resetTokenExpiresAt < new Date()) {
      throw new BadRequestException(
        'Reset token has expired. Please request a new one',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.usersService.update(user.id, {
      password: passwordHash,
      resetToken: null,
      resetTokenExpiresAt: null,
      refreshTokenHash: null,
    });

    return {
      message: 'Password reset successful. You can now log in.',
    };
  }

  private toSafeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessExpiresIn = (this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
    ) || '15m') as StringValue;
    const refreshExpiresIn = (this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
    ) || '7d') as StringValue;

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: getRequiredSecret(this.configService, 'JWT_ACCESS_SECRET'),
      expiresIn: accessExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: getRequiredSecret(this.configService, 'JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiresIn,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async saveRefreshToken(userId: string, refreshToken: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.update(userId, { refreshTokenHash });
  }

  private getRefreshCookieOptions(maxAge: number): CookieOptions {
    return {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    };
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie(
      'refresh_token',
      refreshToken,
      this.getRefreshCookieOptions(7 * 24 * 60 * 60 * 1000),
    );
  }
}
