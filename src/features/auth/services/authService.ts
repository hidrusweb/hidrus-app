import { apiClient, normalizeApiError } from "../../../core/api/client";
import type { AuthUser, LoginInput } from "../types/auth";

function decodeTokenPayload(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = globalThis.atob(base64);
  return JSON.parse(decoded);
}

function parseAuthUser(token: string, remember: boolean, senha?: string): AuthUser {
  const raw = decodeTokenPayload(token);
  return {
    id: String(raw.nameid ?? raw.nameidentifier ?? raw.sub ?? ""),
    nome: String(raw.unique_name ?? raw.name ?? ""),
    cpf: String(raw.cpf ?? raw.cpfCnpj ?? raw.emailCpf ?? ""),
    email: String(raw.email ?? raw.upn ?? ""),
    loginId: String(raw.unique_name ?? raw.email ?? ""),
    lembrar: remember,
    senha,
    token,
  };
}

function accountLoginId(me: Record<string, unknown>): string {
  const u = me.UserName ?? me.userName;
  const e = me.Email ?? me.email;
  return String(u || e || "").trim();
}

/** CPF/CNPJ para exibição: claim no JWT não existe; no TB_USER costuma estar em UserName (formatado) ou coluna dedicada. */
function cpfFromAccountMe(me: Record<string, unknown>): string {
  for (const key of ["Cpf", "cpf", "CPF", "Documento", "documento", "Cnpj", "cnpj"]) {
    const v = me[key];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  const userName = String(me.UserName ?? me.userName ?? "").trim();
  const digits = userName.replace(/\D/g, "");
  if (digits.length === 11 || digits.length === 14) return userName;
  return "";
}

export type AccountMeProfile = {
  id?: string;
  nome?: string;
  email?: string;
  cpf?: string;
  loginId?: string;
};

export async function getAccountProfile(): Promise<AccountMeProfile> {
  const { data } = await apiClient.get("/account/me");
  const me = (data ?? {}) as Record<string, unknown>;
  const nomePart = [me.Nome, me.Sobrenome].filter((x) => x != null && String(x).trim() !== "").map(String);
  const nome = nomePart.join(" ").trim();
  const email = String(me.Email ?? me.email ?? "").trim();
  const id = String(me.Id ?? me.id ?? "").trim();
  const cpf = cpfFromAccountMe(me);
  const loginId = accountLoginId(me);
  return {
    ...(id ? { id } : {}),
    ...(nome ? { nome } : {}),
    ...(email ? { email } : {}),
    ...(cpf ? { cpf } : {}),
    ...(loginId ? { loginId } : {}),
  };
}

export async function getAccountLoginId(): Promise<string> {
  try {
    const { data } = await apiClient.get("/account/me");
    return accountLoginId(data ?? {});
  } catch (error) {
    console.log("[AUTH] /account/me unavailable, using token claims fallback");
    return "";
  }
}

export async function login(input: LoginInput): Promise<AuthUser> {
  try {
    const { data } = await apiClient.post("/account/login/common", {
      emailCpf: input.emailCpf,
      senha: input.senha,
    });
    const token = String(data?.accessToken ?? "");
    if (!token) throw new Error("Token nao retornado.");
    return parseAuthUser(token, input.lembrar, input.senha);
  } catch (error) {
    throw new Error(normalizeApiError(error));
  }
}

export async function register(cpf: string, password: string): Promise<void> {
  try {
    await apiClient.post("/account/create/common", { cpf, password });
  } catch (error) {
    throw new Error(normalizeApiError(error));
  }
}

export async function validateCpfCnpj(cpfCnpj: string): Promise<void> {
  try {
    const { data } = await apiClient.get("/account/exists/common", {
      params: { emailCpf: cpfCnpj },
    });
    if (!data?.hasEmailCpf) {
      throw new Error("Nenhuma unidade esta vinculada a este CPF/CNPJ.");
    }
  } catch (error) {
    throw new Error(normalizeApiError(error));
  }
}

export async function changePassword(cpfCnpj: string, password: string): Promise<void> {
  try {
    await apiClient.put("/account/change-password", {
      emailCpf: cpfCnpj,
      senhaAtual: password,
      novaSenha: password,
    });
  } catch (error) {
    throw new Error(normalizeApiError(error));
  }
}
