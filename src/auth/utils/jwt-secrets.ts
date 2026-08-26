import { ConfigService } from '@nestjs/config';

export function getRequiredSecret(config: ConfigService, key: string): string {
  const value = config.get<string>(key)?.trim();

  if (!value) {
    throw new Error(`${key} is not configured`);
  }

  return value;
}

export function assertJwtSecrets(config: ConfigService): void {
  const access = getRequiredSecret(config, 'JWT_ACCESS_SECRET');
  const refresh = getRequiredSecret(config, 'JWT_REFRESH_SECRET');

  if (access === refresh) {
    throw new Error(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different',
    );
  }
}
