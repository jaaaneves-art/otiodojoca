// lib/uploads/validar-imagem.ts
//
// PROPOSTA — novo ficheiro. Validação server-side de imagens para os
// marketplaces, com o mesmo padrão já usado em lib/social/media.ts
// (assinatura mágica, allowlist de MIME, limite de tamanho) — ver
// AUDITORIA-VALIDACAO-INDEPENDENTE-20260911.md, achado P1 "uploads dos
// marketplaces sem validação no servidor".
//
// Aplicado aqui a app/mercado-da-terra/novo/page.tsx como exemplo; o
// mesmo padrão deve ser aplicado aos outros pontos com `.upload()` em
// lib/marketplace/*-actions.ts e nas páginas novo/editar de lup,
// imoveis, gran-bazar e viaturas (ver lista completa no relatório).
//
// Não é um decoder completo nem um antivírus -- só confirma que os
// primeiros bytes correspondem ao formato declarado, tal como o
// comentário equivalente em lib/social/media.ts já assinala.

export const IMAGEM_MAX_BYTES = 5 * 1024 * 1024; // 5 MB por imagem
export const IMAGEM_MAX_FICHEIROS = 5; // alinhado com o comentário em next.config.js
export const IMAGEM_TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"] as const;

export type ImagemTipoPermitido = (typeof IMAGEM_TIPOS_PERMITIDOS)[number];

/**
 * Valida um único ficheiro de imagem: tamanho, MIME declarado e
 * assinatura mágica (magic bytes) dos primeiros bytes do ficheiro.
 * Devolve null se válido, ou uma mensagem de erro em português.
 */
export async function validarImagem(file: File): Promise<string | null> {
  if (!(file instanceof File) || file.size < 1) {
    return "Ficheiro inválido.";
  }
  if (file.size > IMAGEM_MAX_BYTES) {
    return `Cada imagem tem de ter no máximo ${IMAGEM_MAX_BYTES / (1024 * 1024)} MB.`;
  }
  if (!IMAGEM_TIPOS_PERMITIDOS.includes(file.type as ImagemTipoPermitido)) {
    return "Aceitamos apenas imagens JPG, PNG ou WebP.";
  }

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));

  const assinaturaValida =
    file.type === "image/jpeg"
      ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : file.type === "image/png"
        ? [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)
        : file.type === "image/webp"
          ? ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP"
          : false;

  if (!assinaturaValida) {
    return "O conteúdo do ficheiro não corresponde ao formato indicado.";
  }

  return null;
}

/** Valida a contagem do lote e cada imagem individualmente. */
export async function validarLoteImagens(
  files: File[],
  opts: { maxFicheiros?: number } = {}
): Promise<string | null> {
  const max = opts.maxFicheiros ?? IMAGEM_MAX_FICHEIROS;
  if (files.length > max) {
    return `Só podes enviar até ${max} imagens.`;
  }
  for (const file of files) {
    const erro = await validarImagem(file);
    if (erro) return erro;
  }
  return null;
}

/** Extensão coerente com o MIME real, em vez de forçar sempre ".jpg". */
export function extensaoParaImagem(tipo: string): string {
  switch (tipo) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}
