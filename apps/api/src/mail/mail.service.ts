import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SentEmailRecord {
  to: string;
  subject: string;
  link: string;
  type: 'activation' | 'password-reset';
  sentAt: Date;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private sentEmailsHistory: SentEmailRecord[] = [];

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`📧 Transporte de e-mail SMTP configurado com sucesso (${host}:${port}).`);
    } else {
      this.logger.log(
        'ℹ️ Servidor SMTP real não configurado. Operando em modo de desenvolvimento (links de ativação e recuperação serão logados no console).'
      );
    }
  }

  private getFrontendUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:5173'
    ).replace(/\/$/, '');
  }

  private getSender(): string {
    return (
      this.configService.get<string>('SMTP_FROM') ||
      '"ERP Gráfica Modular" <nao-responda@erpgrafica.com>'
    );
  }

  /**
   * Envia convite de ativação e definição de senha para novo usuário cadastrado
   */
  async sendUserInvitation(params: {
    to: string;
    name: string;
    token: string;
  }): Promise<{ success: boolean; link: string }> {
    const activationLink = `${this.getFrontendUrl()}/activate?token=${params.token}`;
    const subject = 'Ativação de Conta - ERP Gráfica Modular';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f172a; font-size: 22px; margin: 0;">ERP Gráfica Modular</h1>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Sistema de Gestão Industrial e PCP</p>
        </div>
        <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #cbd5e1;">
          <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">Olá, ${params.name}!</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            Um administrador criou seu acesso no <strong>ERP Gráfica Modular</strong>.
          </p>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            Para ativar sua conta, confirmar seu e-mail e cadastrar sua senha pessoal de acesso, clique no botão abaixo:
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${activationLink}" style="background-color: #059669; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
              Ativar Minha Conta e Criar Senha
            </a>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
            Ou copie e cole este link no seu navegador:<br/>
            <a href="${activationLink}" style="color: #0284c7; word-break: break-all;">${activationLink}</a>
          </p>
          <p style="color: #94a3b8; font-size: 11px; margin-top: 20px;">
            Este link é válido por 48 horas. Se você não solicitou este acesso, favor desconsiderar esta mensagem.
          </p>
        </div>
      </div>
    `;

    this.sentEmailsHistory.push({
      to: params.to,
      subject,
      link: activationLink,
      type: 'activation',
      sentAt: new Date(),
    });

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.getSender(),
          to: params.to,
          subject,
          html,
        });
        this.logger.log(`✅ E-mail de convite enviado via SMTP para ${params.to}`);
      } catch (err: any) {
        this.logger.error(`❌ Falha ao despachar e-mail SMTP para ${params.to}: ${err.message}`);
      }
    } else {
      this.logger.warn(`📨 [DEV MODE - CONVITE DE USUÁRIO]`);
      this.logger.warn(`   Para: ${params.to} (${params.name})`);
      this.logger.warn(`   Link de Ativação: ${activationLink}`);
    }

    return { success: true, link: activationLink };
  }

  /**
   * Envia link de redefinição de senha em caso de esquecimento
   */
  async sendPasswordReset(params: {
    to: string;
    name: string;
    token: string;
  }): Promise<{ success: boolean; link: string }> {
    const resetLink = `${this.getFrontendUrl()}/reset-password?token=${params.token}`;
    const subject = 'Redefinição de Senha - ERP Gráfica Modular';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f172a; font-size: 22px; margin: 0;">ERP Gráfica Modular</h1>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Recuperação de Acesso</p>
        </div>
        <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #cbd5e1;">
          <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">Olá, ${params.name}!</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            Recebemos uma solicitação para redefinir a senha da sua conta vinculada ao e-mail <strong>${params.to}</strong>.
          </p>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            Para escolher uma nova senha, clique no botão seguro abaixo:
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
              Redefinir Minha Senha
            </a>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
            Ou copie e cole este link no seu navegador:<br/>
            <a href="${resetLink}" style="color: #0284c7; word-break: break-all;">${resetLink}</a>
          </p>
          <p style="color: #94a3b8; font-size: 11px; margin-top: 20px;">
            Este link é válido por 1 hora. Se você não solicitou a redefinição de senha, nenhuma ação é necessária e sua senha atual continuará segura.
          </p>
        </div>
      </div>
    `;

    this.sentEmailsHistory.push({
      to: params.to,
      subject,
      link: resetLink,
      type: 'password-reset',
      sentAt: new Date(),
    });

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.getSender(),
          to: params.to,
          subject,
          html,
        });
        this.logger.log(`✅ E-mail de redefinição enviado via SMTP para ${params.to}`);
      } catch (err: any) {
        this.logger.error(`❌ Falha ao despachar e-mail SMTP para ${params.to}: ${err.message}`);
      }
    } else {
      this.logger.warn(`🔑 [DEV MODE - RECUPERAÇÃO DE SENHA]`);
      this.logger.warn(`   Para: ${params.to} (${params.name})`);
      this.logger.warn(`   Link de Redefinição: ${resetLink}`);
    }

    return { success: true, link: resetLink };
  }

  /**
   * Retorna os últimos e-mails enviados (útil para testes unitários ou inspeção dev)
   */
  getSentEmails(): SentEmailRecord[] {
    return [...this.sentEmailsHistory];
  }
}
