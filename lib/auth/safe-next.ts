// lib/auth/safe-next.ts
//
// PROPOSTA — novo ficheiro. Valida o parâmetro "next" usado para
// redirecionar depois do login/MFA, para impedir open-redirect.
//
// Regras (ver AUDITORIA-APROFUNDADA.md, achado P1 "redirecionamentos
// pós-login/MFA não validados"):
//   - só aceita caminhos internos, começados por exatamente uma "/";
//   - rejeita esquemas (http:, https:, javascript:, etc.) e URLs
//     protocol-relative ("//evil.com", que o browser trata como
//     mudança de origem);
//   - rejeita backslashes (alguns browsers normalizam "\" para "/",
//     permitindo variantes tipo "/\evil.com" ou "/\/evil.com");
//   - rejeita caracteres de controlo;
//   - por omissão, devolve "/".

const CAMINHO_INTERNO_VALIDO = /^\/(?!\/)[^\s\\]*$/;

export function safeNext(valorBruto: string | null | undefined, destinoPorOmissao = "/"): string {
  if (!valorBruto) return destinoPorOmissao;

  // Rejeita caracteres de controlo (inclui \n, \r, tabs, etc.)
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f]/.test(valorBruto)) return destinoPorOmissao;

  // Tem de começar por exatamente uma barra (não "//", não conter "\")
  if (!CAMINHO_INTERNO_VALIDO.test(valorBruto)) return destinoPorOmissao;

  // Última defesa: se o URL parser conseguir dar-lhe um "host" diferente
  // de undefined, não é um caminho relativo seguro.
  try {
    const testado = new URL(valorBruto, "http://localhost");
    if (testado.origin !== "http://localhost") return destinoPorOmissao;
  } catch {
    return destinoPorOmissao;
  }

  return valorBruto;
}
