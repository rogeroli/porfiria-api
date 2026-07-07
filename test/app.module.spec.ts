import { Test } from '@nestjs/testing';

describe('AppModule', () => {
  it('compiles the application module', async () => {
    process.env.DATABASE_URL = 'postgresql://porfiria:porfiria@localhost:5432/porfiria?schema=public';

    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef).toBeDefined();
  });
});
