import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientType, createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly client: RedisClientType;

  constructor(configService: ConfigService) {
    this.client = createClient({
      url: configService.getOrThrow<string>('REDIS_URL'),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  async setJson<TValue>(key: string, value: TValue, ttlSeconds: number): Promise<void> {
    await this.client.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    });
  }

  async getJson<TValue>(key: string): Promise<TValue | null> {
    const value = await this.client.get(key);

    return value ? (JSON.parse(value) as TValue) : null;
  }

  async delete(key: string): Promise<boolean> {
    const deletedCount = await this.client.del(key);

    return deletedCount > 0;
  }
}
