import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { extname, join } from 'path';
import { pipeline } from 'stream/promises';
import { MultipartFile } from '@fastify/multipart';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizItemDto } from './dto/create-quiz-item.dto';
import { ReorderQuestionnaireItemsDto } from './dto/reorder-questionnaire-items.dto';
import { QuestionnaireStatus } from './enums/questionnaire-status.enum';
import { QuestionnaireContentFormat } from './enums/questionnaire-content-format.enum';
import { QuestionnaireContentInput } from './types/questionnaire-content-input';

const VIDEO_UPLOAD_ROOT = join(process.cwd(), 'uploads', 'videos');
const VIDEO_PUBLIC_UPLOAD_PREFIX = '/uploads/videos';

@Injectable()
export class QuestionnairesService {
  constructor(private readonly prisma: PrismaService) {}

  async createQuestionnaire(adminUserId: string, input: QuestionnaireContentInput) {
    this.validateQuestionnaireInput(input);
    const contentData = this.buildContentData(input);
    const questionnaire = await this.prisma.questionnaire.create({
      data: {
        title: input.title,
        description: input.description,
        createdById: adminUserId,
        ...contentData,
      },
      include: this.getQuestionnaireInclude(),
    });

    return this.getQuestionnaire(questionnaire.id);
  }

  async listPublishedQuestionnaires(profileId: string) {
    const profileTrails = await this.prisma.profileTrail.findMany({
      where: {
        profileId,
        profile: { status: 'ACTIVE' },
        questionnaire: { status: QuestionnaireStatus.Published },
      },
      orderBy: { order: 'asc' },
      include: { questionnaire: { include: this.getQuestionnaireInclude() } },
    });

    return profileTrails.map((profileTrail) => this.mapQuestionnaire(profileTrail.questionnaire));
  }

  async listAdminQuestionnaires() {
    const questionnaires = await this.prisma.questionnaire.findMany({
      orderBy: { createdAt: 'desc' },
      include: this.getQuestionnaireInclude(),
    });

    return questionnaires.map((questionnaire) => this.mapQuestionnaire(questionnaire));
  }

  async getQuestionnaire(id: string) {
    const questionnaire = await this.prisma.questionnaire.findUnique({
      where: { id },
      include: this.getQuestionnaireInclude(),
    });

    if (!questionnaire) {
      throw new NotFoundException('Questionario nao encontrado.');
    }

    return this.mapQuestionnaire(questionnaire);
  }

  async updateQuestionnaire(id: string, input: QuestionnaireContentInput) {
    const currentQuestionnaire = await this.getQuestionnaire(id);
    const currentContentFormat = String(currentQuestionnaire.contentFormat);
    const requestedContentFormat = String(input.contentFormat);
    const hasReusableFile = currentContentFormat === requestedContentFormat && Boolean(currentQuestionnaire.contentFilePath);
    this.validateQuestionnaireInput(input, hasReusableFile);
    const contentData = this.buildContentData(input, currentQuestionnaire);

    await this.prisma.questionnaire.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        ...contentData,
      },
    });

    return this.getQuestionnaire(id);
  }

  async updateQuestionnaireStatus(id: string, status: QuestionnaireStatus) {
    const questionnaire = await this.getQuestionnaire(id);

    if (status === QuestionnaireStatus.Published && questionnaire.items.length === 0) {
      throw new BadRequestException('O questionario precisa ter ao menos um item para ser publicado.');
    }

    await this.prisma.questionnaire.update({
      where: { id },
      data: { status },
    });

    return this.getQuestionnaire(id);
  }

  async reorderItems(questionnaireId: string, input: ReorderQuestionnaireItemsDto) {
    await this.ensureQuestionnaireExists(questionnaireId);

    const currentItems = await this.prisma.questionnaireItem.findMany({
      where: { questionnaireId },
      select: { id: true },
    });
    const currentIds = new Set(currentItems.map((item) => item.id));
    const requestedIds = new Set(input.items.map((item) => item.id));
    const requestedOrders = new Set(input.items.map((item) => item.order));

    if (input.items.length !== currentItems.length || requestedIds.size !== currentItems.length) {
      throw new BadRequestException('Informe todos os itens do questionario para reordenar.');
    }

    if (input.items.some((item) => !currentIds.has(item.id))) {
      throw new BadRequestException('Todos os itens informados devem pertencer ao questionario.');
    }

    if (requestedOrders.size !== input.items.length) {
      throw new BadRequestException('Cada item deve possuir uma ordem unica.');
    }

    await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        input.items.map((item, index) =>
          tx.questionnaireItem.update({
            where: { id: item.id },
            data: { order: currentItems.length + index + 1000 },
          }),
        ),
      );

      await Promise.all(
        input.items.map((item) =>
          tx.questionnaireItem.update({
            where: { id: item.id },
            data: { order: item.order },
          }),
        ),
      );
    });

    return this.getQuestionnaire(questionnaireId);
  }

  async createQuizItem(questionnaireId: string, input: CreateQuizItemDto) {
    await this.ensureQuestionnaireExists(questionnaireId);
    this.validateQuizOptions(input.options);
    const order = input.order ?? (await this.getNextQuestionnaireItemOrder(questionnaireId));

    return this.prisma.questionnaireItem.create({
      data: {
        questionnaireId,
        type: 'QUIZ',
        order,
        question: input.question,
        options: {
          create: input.options.map((option, index) => ({
            text: option.text,
            isCorrect: option.isCorrect,
            order: index + 1,
          })),
        },
      },
      include: { options: { orderBy: { order: 'asc' } } },
    });
  }

  async createVideoItem(questionnaireId: string, file: MultipartFile | undefined, order?: number) {
    await this.ensureQuestionnaireExists(questionnaireId);

    if (!file) {
      throw new BadRequestException('Envie um arquivo de video.');
    }

    if (!file.mimetype.startsWith('video/')) {
      throw new BadRequestException('O arquivo enviado precisa ser um video.');
    }

    const itemOrder = order ?? (await this.getNextQuestionnaireItemOrder(questionnaireId));
    const storedFileName = `${randomUUID()}${this.getSafeExtension(file.filename)}`;
    await mkdir(VIDEO_UPLOAD_ROOT, { recursive: true });
    await pipeline(file.file, createWriteStream(join(VIDEO_UPLOAD_ROOT, storedFileName)));

    return this.prisma.questionnaireItem.create({
      data: {
        questionnaireId,
        type: 'VIDEO',
        order: itemOrder,
        videoPath: `${VIDEO_PUBLIC_UPLOAD_PREFIX}/${storedFileName}`,
        videoOriginalName: file.filename,
        videoMimeType: file.mimetype,
      },
      include: { options: { orderBy: { order: 'asc' } } },
    });
  }


  private validateQuestionnaireInput(input: QuestionnaireContentInput, hasExistingFile = false): void {
    if (input.title.trim().length < 3) {
      throw new BadRequestException('Informe um titulo com pelo menos 3 caracteres.');
    }

    if (input.description.trim().length < 10) {
      throw new BadRequestException('Informe uma descricao com pelo menos 10 caracteres.');
    }

    if ([QuestionnaireContentFormat.Html, QuestionnaireContentFormat.Txt].includes(input.contentFormat)) {
      if (!input.contentText || input.contentText.trim().length === 0) {
        throw new BadRequestException('Informe o conteudo do questionario.');
      }
      return;
    }

    if (!input.contentFile && !hasExistingFile) {
      throw new BadRequestException('Envie um arquivo para o conteudo do questionario.');
    }

    if (!input.contentFile) {
      return;
    }

    if (input.contentFormat === QuestionnaireContentFormat.Video && !input.contentFile.mimeType.startsWith('video/')) {
      throw new BadRequestException('O conteudo enviado precisa ser um video.');
    }

    if (input.contentFormat === QuestionnaireContentFormat.Pdf && input.contentFile.mimeType !== 'application/pdf') {
      throw new BadRequestException('O conteudo enviado precisa ser um PDF.');
    }
  }

  private buildContentData(
    input: QuestionnaireContentInput,
    existingQuestionnaire?: {
      contentFilePath: string | null;
      contentFileOriginalName: string | null;
      contentFileMimeType: string | null;
    },
  ) {
    if ([QuestionnaireContentFormat.Html, QuestionnaireContentFormat.Txt].includes(input.contentFormat)) {
      return {
        contentFormat: input.contentFormat,
        contentText: input.contentText?.trim(),
        contentFilePath: null,
        contentFileOriginalName: null,
        contentFileMimeType: null,
      };
    }

    if (!input.contentFile) {
      if (existingQuestionnaire?.contentFilePath) {
        return {
          contentFormat: input.contentFormat,
          contentText: null,
          contentFilePath: existingQuestionnaire.contentFilePath,
          contentFileOriginalName: existingQuestionnaire.contentFileOriginalName,
          contentFileMimeType: existingQuestionnaire.contentFileMimeType,
        };
      }

      throw new BadRequestException('Envie um arquivo para o conteudo do questionario.');
    }

    return {
      contentFormat: input.contentFormat,
      contentText: null,
      contentFilePath: input.contentFile.path,
      contentFileOriginalName: input.contentFile.originalName,
      contentFileMimeType: input.contentFile.mimeType,
    };
  }

  private async ensureQuestionnaireExists(questionnaireId: string): Promise<void> {
    const questionnaire = await this.prisma.questionnaire.findUnique({ where: { id: questionnaireId } });

    if (!questionnaire) {
      throw new NotFoundException('Questionario nao encontrado.');
    }
  }

  private async getNextQuestionnaireItemOrder(questionnaireId: string): Promise<number> {
    const lastItem = await this.prisma.questionnaireItem.findFirst({
      where: { questionnaireId },
      orderBy: { order: 'desc' },
    });

    return (lastItem?.order ?? 0) + 1;
  }

  private validateQuizOptions(options: CreateQuizItemDto['options']): void {
    if (!options.some((option) => option.isCorrect)) {
      throw new BadRequestException('Informe ao menos uma resposta correta.');
    }
  }

  private getSafeExtension(fileName: string): string {
    const extension = extname(fileName).toLowerCase();

    return extension || '.mp4';
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
}
