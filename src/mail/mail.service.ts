import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface SendMailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendMail(input: SendMailInput): Promise<void> {
    const driver = this.configService.get<string>('MAIL_DRIVER') ?? 'console';
    const user = this.configService.get<string>('MAIL_USER');
    const password = this.configService.get<string>('MAIL_PASSWORD');

    if (driver === 'console' || !user || !password) {
      this.logger.log(
        `Email em modo console para ${input.to}: ${input.subject} - ${input.text}`,
      );
      return;
    }

    const port = Number(this.configService.get<string>('MAIL_PORT') ?? '587');
    const secure = this.configService.get<string>('MAIL_SECURE') === 'true';
    const host = this.configService.get<string>('MAIL_HOST') ?? 'smtp.gmail.com';
    this.logger.log(
      `Enviando email via SMTP para ${input.to} usando ${host}:${port} secure=${secure}`,
    );
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass: password.replace(/\s/g, ''),
      },
    });

    try {
      const result = await transporter.sendMail({
        from: this.getFromAddress(),
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
      this.logger.log(`Email enviado para ${input.to}. messageId=${result.messageId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Falha ao enviar email para ${input.to}: ${message}`);
      throw error;
    }
  }

  private getFromAddress(): string {
    const name = this.configService.get<string>('MAIL_FROM_NAME') ?? 'Porfiria Academy';
    const address =
      this.configService.get<string>('MAIL_FROM_ADDRESS') ??
      this.configService.getOrThrow<string>('MAIL_USER');

    return `"${name}" <${address}>`;
  }
}
