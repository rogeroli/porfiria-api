import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateProfileStatusDto } from './dto/update-profile-status.dto';
import { UpdateProfileQuestionnairesDto } from './dto/update-profile-questionnaires.dto';
import { ProfilesService } from './profiles.service';

@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('active')
  listActive() {
    return this.profilesService.listActive();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  listAdmin() {
    return this.profilesService.listAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  create(@Body() input: CreateProfileDto) {
    return this.profilesService.create(input);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() input: UpdateProfileDto) {
    return this.profilesService.update(id, input);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  updateStatus(@Param('id') id: string, @Body() input: UpdateProfileStatusDto) {
    return this.profilesService.updateStatus(id, input.status);
  }

  @Get(':id/trails')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  getProfileQuestionnaires(@Param('id') id: string) {
    return this.profilesService.getProfileQuestionnaires(id);
  }

  @Put(':id/trails')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  updateProfileQuestionnaires(@Param('id') id: string, @Body() input: UpdateProfileQuestionnairesDto) {
    return this.profilesService.updateProfileQuestionnaires(id, input);
  }
}
