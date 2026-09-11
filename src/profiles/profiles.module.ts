import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [JwtModule.register({}), PrismaModule, UsersModule],
  controllers: [ProfilesController],
  providers: [ProfilesService, AdminGuard, JwtAuthGuard],
  exports: [ProfilesService],
})
export class ProfilesModule {}
