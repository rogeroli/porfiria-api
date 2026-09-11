import {
  Body,
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MultipartFile } from '@fastify/multipart';
import { FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { extname, join } from 'path';
import { pipeline } from 'stream/promises';
import { ApiBearerAuth, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtAuthenticatedUser } from '../auth/types/jwt-authenticated-user';
import { CreateQuizItemDto } from './dto/create-quiz-item.dto';
import { ReorderQuestionnaireItemsDto } from './dto/reorder-questionnaire-items.dto';
import { UpdateQuestionnaireStatusDto } from './dto/update-questionnaire-status.dto';
import { QuestionnairesService } from './questionnaires.service';
import { QuestionnaireContentFormat } from './enums/questionnaire-content-format.enum';
import { QuestionnaireContentFileInput, QuestionnaireContentInput } from './types/questionnaire-content-input';

const CONTENT_UPLOAD_ROOT = join(process.cwd(), 'uploads', 'questionnaires');
const CONTENT_PUBLIC_UPLOAD_PREFIX = '/uploads/questionnaires';

type MultipartField = {
  type: 'field';
  fieldname: string;
  value: unknown;
};

type MultipartPart = MultipartFile | MultipartField;

type MultipartRequest = FastifyRequest & {
  file: () => Promise<MultipartFile | undefined>;
  isMultipart?: () => boolean;
  parts: () => AsyncIterableIterator<MultipartPart>;
};

@ApiTags('questionnaires')
@Controller('questionnaires')
export class QuestionnairesController {
  constructor(private readonly questionnairesService: QuestionnairesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listPublished(@CurrentUser() user: JwtAuthenticatedUser) {
    return this.questionnairesService.listPublishedQuestionnaires(user.profileId);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  listAdmin() {
    return this.questionnairesService.listAdminQuestionnaires();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getQuestionnaire(@Param('id') id: string) {
    return this.questionnairesService.getQuestionnaire(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  async createQuestionnaire(@CurrentUser() user: JwtAuthenticatedUser, @Req() request: MultipartRequest) {
    const input = await this.readQuestionnaireInput(request);

    return this.questionnairesService.createQuestionnaire(user.id, input);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  async updateQuestionnaire(@Param('id') id: string, @Req() request: MultipartRequest) {
    const input = await this.readQuestionnaireInput(request);

    return this.questionnairesService.updateQuestionnaire(id, input);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  updateStatus(@Param('id') id: string, @Body() input: UpdateQuestionnaireStatusDto) {
    return this.questionnairesService.updateQuestionnaireStatus(id, input.status);
  }

  @Patch(':id/items/reorder')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  reorderItems(@Param('id') id: string, @Body() input: ReorderQuestionnaireItemsDto) {
    return this.questionnairesService.reorderItems(id, input);
  }

  @Post(':id/items/quiz')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  createQuizItem(@Param('id') id: string, @Body() input: CreateQuizItemDto) {
    return this.questionnairesService.createQuizItem(id, input);
  }

  @Post(':id/items/video')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse()
  async createVideoItem(
    @Param('id') id: string,
    @Req() request: MultipartRequest,
    @Query('order', new ParseIntPipe({ optional: true })) order?: number,
  ) {
    const file = await request.file();

    return this.questionnairesService.createVideoItem(id, file, order);
  }

  private async readQuestionnaireInput(request: MultipartRequest): Promise<QuestionnaireContentInput> {
    if (typeof request.parts !== 'function' || request.isMultipart?.() === false) {
      throw new BadRequestException('Envie os dados do questionario como multipart/form-data.');
    }

    const fields: Record<string, string> = {};
    let contentFile: QuestionnaireContentFileInput | undefined;

    for await (const part of request.parts()) {
      if (part.type === 'file') {
        if (part.fieldname === 'contentFile') {
          contentFile = await this.storeContentFile(part);
          continue;
        }

        part.file.resume();
        continue;
      }

      if (typeof part.value === 'string') {
        fields[part.fieldname] = part.value;
      }
    }

    return {
      title: fields.title ?? '',
      description: fields.description ?? '',
      contentFormat: this.parseContentFormat(fields.contentFormat),
      contentText: fields.contentText,
      contentFile,
    };
  }

  private parseContentFormat(value: string | undefined): QuestionnaireContentFormat {
    if (value && Object.values(QuestionnaireContentFormat).includes(value as QuestionnaireContentFormat)) {
      return value as QuestionnaireContentFormat;
    }

    return QuestionnaireContentFormat.Txt;
  }

  private async storeContentFile(file: MultipartFile): Promise<QuestionnaireContentFileInput> {
    if (!file.filename) {
      throw new BadRequestException('Envie um arquivo valido para o conteudo.');
    }

    const storedFileName = `${randomUUID()}${this.getSafeExtension(file.filename)}`;
    await mkdir(CONTENT_UPLOAD_ROOT, { recursive: true });
    await pipeline(file.file, createWriteStream(join(CONTENT_UPLOAD_ROOT, storedFileName)));

    return {
      path: `${CONTENT_PUBLIC_UPLOAD_PREFIX}/${storedFileName}`,
      originalName: file.filename,
      mimeType: file.mimetype,
    };
  }

  private getSafeExtension(fileName: string): string {
    const extension = extname(fileName).toLowerCase();

    return extension || '.bin';
  }

}
