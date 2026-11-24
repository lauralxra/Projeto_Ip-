import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'crypto';
import { unlink } from 'fs';
import { diskStorage } from 'multer';
import { join, normalize, sep } from 'path';

// Pasta servida publicamente em /<prefixo da API>/uploads (ver main.ts)
export const PASTA_UPLOADS = join(process.cwd(), 'uploads');

// A extensão vem do tipo da imagem, nunca do nome enviado: impede gravar um
// "foto.html" que depois seria servido como página
const EXTENSAO_POR_TIPO: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB

export function opcoesUploadImagem(subpasta: string): MulterOptions {
  return {
    storage: diskStorage({
      destination: join(PASTA_UPLOADS, subpasta),
      filename: (_req, file, cb) =>
        cb(null, `${randomUUID()}${EXTENSAO_POR_TIPO[file.mimetype]}`),
    }),
    limits: { fileSize: TAMANHO_MAXIMO, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (!EXTENSAO_POR_TIPO[file.mimetype]) {
        return cb(
          new BadRequestException(
            'Formato de imagem inválido. Use JPEG, PNG ou WEBP.',
          ),
          false,
        );
      }
      cb(null, true);
    },
  };
}

// Caminho público gravado no banco (ex.: /uploads/nucleos/<uuid>.png)
export function urlDoUpload(subpasta: string, nomeArquivo: string) {
  return `/uploads/${subpasta}/${nomeArquivo}`;
}

// Remove um arquivo enviado. Só apaga dentro de uploads/, mesmo que a URL
// gravada no banco aponte para outro lugar (ex.: imagemUrl externa)
export function removerUpload(url: string | null | undefined) {
  if (!url?.startsWith('/uploads/')) return;

  const caminho = normalize(join(process.cwd(), url));
  if (!caminho.startsWith(PASTA_UPLOADS + sep)) return;

  unlink(caminho, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.warn(`[UPLOAD] Não foi possível remover ${url}: ${err.message}`);
    }
  });
}
