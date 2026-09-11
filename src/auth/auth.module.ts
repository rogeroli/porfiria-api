import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminGuard } from './guards/admin.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [JwtModule.register({}), MailModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService, AdminGuard, JwtAuthGuard],
  exports: [AdminGuard, JwtAuthGuard],
})
export class AuthModule {}
