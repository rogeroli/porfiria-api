import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileStatus } from './enums/profile-status.enum';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateProfileQuestionnairesDto } from './dto/update-profile-questionnaires.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  listAll() {
    return this.prisma.profile.findMany({ orderBy: { createdAt: 'asc' } });
  }

  listActive() {
    return this.prisma.profile.findMany({
      where: { status: ProfileStatus.Active },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(input: CreateProfileDto) {
    return this.prisma.profile.create({
      data: {
        code: this.createCode(input.name),
        name: input.name,
        description: input.description,
      },
    });
  }

  async update(id: string, input: UpdateProfileDto) {
    await this.ensureProfileExists(id);

    return this.prisma.profile.update({
      where: { id },
      data: input,
    });
  }

  async updateStatus(id: string, status: ProfileStatus) {
    await this.ensureProfileExists(id);

    return this.prisma.profile.update({
      where: { id },
      data: { status },
    });
  }

  async getProfileQuestionnaires(profileId: string) {
    await this.ensureProfileExists(profileId);

    const [assignedQuestionnaires, availableQuestionnaires] = await Promise.all([
      this.prisma.profileTrail.findMany({
        where: { profileId },
        orderBy: { order: 'asc' },
        include: { questionnaire: { include: this.getQuestionnaireInclude() } },
      }),
      this.prisma.questionnaire.findMany({
        where: { status: { not: 'DISABLED' } },
        orderBy: { createdAt: 'desc' },
        include: this.getQuestionnaireInclude(),
      }),
    ]);
    const assignedIds = new Set(assignedQuestionnaires.map((item) => item.questionnaireId));

    return {
      assignedQuestionnaires: assignedQuestionnaires.map((item) => ({
        ...this.mapQuestionnaire(item.questionnaire),
        profileOrder: item.order,
      })),
      availableQuestionnaires: availableQuestionnaires
        .filter((questionnaire) => !assignedIds.has(questionnaire.id))
        .map((questionnaire) => this.mapQuestionnaire(questionnaire)),
    };
  }

  async updateProfileQuestionnaires(profileId: string, input: UpdateProfileQuestionnairesDto) {
    await this.ensureProfileExists(profileId);
    const uniqueQuestionnaireIds = Array.from(new Set(input.questionnaireIds));

    if (uniqueQuestionnaireIds.length !== input.questionnaireIds.length) {
      throw new BadRequestException('A lista de questionarios nao pode possuir itens duplicados.');
    }

    const questionnaires = await this.prisma.questionnaire.findMany({
      where: { id: { in: uniqueQuestionnaireIds }, status: { not: 'DISABLED' } },
      select: { id: true },
    });

    if (questionnaires.length !== uniqueQuestionnaireIds.length) {
      throw new BadRequestException('Todos os questionarios informados devem existir e estar ativos.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.profileTrail.deleteMany({ where: { profileId } });
      if (uniqueQuestionnaireIds.length > 0) {
        await tx.profileTrail.createMany({
          data: uniqueQuestionnaireIds.map((questionnaireId, index) => ({
            profileId,
            questionnaireId,
            order: index + 1,
          })),
        });
      }
    });

    return this.getProfileQuestionnaires(profileId);
  }


  private getQuestionnaireInclude() {
    return {
      profileTrails: {
        orderBy: { order: 'asc' as const },
        include: { profile: true },
      },
      items: {
        orderBy: { order: 'asc' as const },
        include: { options: { orderBy: { order: 'asc' as const } } },
      },
    };
  }

  private mapQuestionnaire<T extends { profileTrails: Array<{ profile: unknown }> }>(questionnaire: T) {
    const { profileTrails, ...questionnaireData } = questionnaire;

    return {
      ...questionnaireData,
      targetProfiles: profileTrails.map((profileTrail) => profileTrail.profile),
    };
  }

  private async ensureProfileExists(id: string): Promise<void> {
    const profile = await this.prisma.profile.findUnique({ where: { id } });

    if (!profile) {
      throw new NotFoundException('Perfil nao encontrado.');
    }
  }

  private createCode(name: string): string {
    const normalized = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    return `${normalized || 'PROFILE'}_${Date.now()}`;
  }
}
