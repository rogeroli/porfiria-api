import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { QuestionnairesController } from './questionnaires.controller';
import { QuestionnairesService } from './questionnaires.service';

@Module({
  imports: [JwtModule.register({}), PrismaModule, UsersModule],
  controllers: [QuestionnairesController],
  providers: [QuestionnairesService, AdminGuard, JwtAuthGuard],
})
export class QuestionnairesModule {}
