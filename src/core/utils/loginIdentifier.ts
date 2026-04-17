/**
 * CPF em digitação: só dígitos, pontuação da máscara (. -) e espaços; deve começar com dígito.
 * Qualquer outro caractere (+, _, @, letras, etc.) → modo e-mail.
 */
function isCpfOnlyInput(s: string): boolean {
  const t = s.trim();
  if (t === "") return true;
  if (!/^[\d.\-\s]*$/.test(t)) return false;
  return /^\d/.test(t);
}

export function isEmailIdentifierPath(text: string): boolean {
  return !isCpfOnlyInput(text.trim());
}

/**
 * Quem começou com números (máscara CPF) e passou a digitar e-mail: remove pontos/traço
 * do prefixo e mantém só os dígitos + o restante (ex.: "200.0" + "t" → "2000t").
 * Se o prefixo não for só CPF (ex.: "+tag@"), devolve o texto sem alterar.
 */
export function unmaskEmailIdentifier(text: string): string {
  const switchRe = /[@\p{L}]|[^\d.\-\s]/u;
  const m = text.match(switchRe);
  if (!m || m.index === undefined) return text;
  const i = m.index;
  if (i === 0) return text;
  const prefix = text.slice(0, i);
  const suffix = text.slice(i);
  if (!isCpfOnlyInput(prefix)) return text;
  return prefix.replace(/\D/g, "") + suffix;
}

/** Máscara progressiva só para CPF (11 dígitos). */
export function maskCpfDigits(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function onLoginIdentifierChange(text: string, fieldOnChange: (v: string) => void) {
  if (isEmailIdentifierPath(text)) {
    fieldOnChange(unmaskEmailIdentifier(text));
    return;
  }
  fieldOnChange(maskCpfDigits(text));
}

/** Valor enviado à API: e-mail trimado; CPF com máscara padrão. */
export function normalizeLoginIdentifierForApi(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes("@")) return trimmed;
  const d = trimmed.replace(/\D/g, "");
  if (d.length === 11) {
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  return trimmed;
}

export function isLikelyEmailForKeyboard(value: string): boolean {
  return isEmailIdentifierPath(value);
}
