import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { CreateNotificacaoDto } from './dto/create-notificacao.dto';
import { AcaoAuditoria, TipoNotificacao } from '@prisma/client';

@Injectable()
export class NotificacaoService {
  private readonly logger = new Logger(NotificacaoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
  ) {}

  async create(dto: CreateNotificacaoDto, autorId: string, ip: string) {
    const destinatarios = await this.resolverDestinatarios(dto);

    if (destinatarios.length === 0) {
      return { message: 'Nenhum destinatário encontrado.' };
    }

    const notificacao = await this.prisma.notificacao.create({
      data: {
        titulo: dto.titulo,
        mensagem: dto.mensagem,
        tipo: dto.tipo,
        nucleoId: dto.nucleoId,
        criadorId: autorId,
        destinatarios: {
          create: destinatarios.map((userId) => ({ userId })),
        },
      },
    });

    void this.enviarEmails(notificacao.id, dto.titulo, dto.mensagem, destinatarios);

    await this.audit.registrarAcao({
      userId: autorId,
      acao: AcaoAuditoria.CRIAR,
      entidade: 'Notificacao',
      entidadeId: notificacao.id,
      dadosNovos: { titulo: dto.titulo, tipo: dto.tipo, totalDestinatarios: destinatarios.length },
      ip,
    });

    return {
      message: 'Notificação criada e enviada com sucesso.',
      id: notificacao.id,
      totalDestinatarios: destinatarios.length,
    };
  }

  private async resolverDestinatarios(dto: CreateNotificacaoDto): Promise<string[]> {
    if (dto.destinatarioIds && dto.destinatarioIds.length > 0) {
      return dto.destinatarioIds;
    }

    const where: Record<string, unknown> = { ativo: true, deletedAt: null };

    if (dto.nucleoId) {
      where.nucleos = { some: { nucleoId: dto.nucleoId } };
    }

    if (dto.perfilAlvo) {
      where.perfil = dto.perfilAlvo;
    }

    const usuarios = await this.prisma.user.findMany({
      where,
      select: { id: true },
    });

    return usuarios.map((u) => u.id);
  }

  private async enviarEmails(
    notificacaoId: string,
    titulo: string,
    mensagem: string,
    userIds: string[],
  ) {
    const usuarios = await this.prisma.user.findMany({
      where: { id: { in: userIds }, ativo: true },
      select: { id: true, email: true },
    });

    for (const usuario of usuarios) {
      try {
        await this.mail.sendNotificacao(usuario.email, titulo, mensagem);
        await this.prisma.notificacaoUsuario.update({
          where: { notificacaoId_userId: { notificacaoId, userId: usuario.id } },
          data: { emailEnviadoEm: new Date() },
        });
      } catch (error) {
        this.logger.error(`Erro ao enviar email para ${usuario.email}:`, error);
        await this.prisma.notificacaoUsuario.update({
          where: { notificacaoId_userId: { notificacaoId, userId: usuario.id } },
          data: { emailErro: String(error) },
        });
      }
    }
  }

  // Roda todo início de trimestre (Jan, Abr, Jul, Out) às 8h
  @Cron('0 8 1 1,4,7,10 *')
  async enviarLembreteTrimestral() {
    this.logger.log('[CRON] Enviando lembretes trimestrais...');

    const nucleos = await this.prisma.nucleo.findMany({
      where: { status: 'ATIVO', deletedAt: null },
      select: { id: true, nome: true },
    });

    for (const nucleo of nucleos) {
      await this.create(
        {
          titulo: 'Lembrete de preenchimento trimestral',
          mensagem: `O período de preenchimento de indicadores do ${nucleo.nome} está aberto.`,
          tipo: TipoNotificacao.PRAZO_PREENCHIMENTO,
          nucleoId: nucleo.id,
        },
        'sistema',
        '0.0.0.0',
      );
    }

    this.logger.log('[CRON] Lembretes trimestrais enviados.');
  }

  findAll() {
    return this.prisma.notificacao.findMany({
      include: { destinatarios: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}