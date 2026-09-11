import { QuestionnaireContentFormat } from '../enums/questionnaire-content-format.enum';

export interface QuestionnaireContentFileInput {
  path: string;
  originalName: string;
  mimeType: string;
}

export interface QuestionnaireContentInput {
  title: string;
  description: string;
  contentFormat: QuestionnaireContentFormat;
  contentText?: string;
  contentFile?: QuestionnaireContentFileInput;
}
