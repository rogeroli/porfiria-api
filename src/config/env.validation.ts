import { plainToInstance } from 'class-transformer';
import { IsEnum, IsOptional, IsPort, IsString, IsUrl, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

enum MailDriver {
  Console = 'console',
  Smtp = 'smtp',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsPort()
  PORT = '3000';

  @IsOptional()
  @IsString()
  API_HOST = '127.0.0.1';

  @IsString()
  DATABASE_URL!: string;

  @IsOptional()
  @IsUrl({ protocols: ['redis', 'rediss'], require_tld: false, require_protocol: true })
  REDIS_URL?: string;

  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  WEB_APP_URL?: string;

  @IsString()
  JWT_ACCESS_SECRET!: string;

  @IsOptional()
  @IsString()
  REFRESH_TOKEN_TTL_HOURS = '24';

  @IsOptional()
  @IsEnum(MailDriver)
  MAIL_DRIVER: MailDriver = MailDriver.Console;

  @IsOptional()
  @IsString()
  MAIL_HOST = 'smtp.gmail.com';

  @IsOptional()
  @IsPort()
  MAIL_PORT = '587';

  @IsOptional()
  @IsString()
  MAIL_SECURE = 'false';

  @IsOptional()
  @IsString()
  MAIL_USER?: string;

  @IsOptional()
  @IsString()
  MAIL_PASSWORD?: string;

  @IsOptional()
  @IsString()
  MAIL_FROM_NAME = 'Porfiria Academy';

  @IsOptional()
  @IsString()
  MAIL_FROM_ADDRESS?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
