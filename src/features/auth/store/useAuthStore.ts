import { create } from "zustand";
import { setApiAuthToken } from "../../../core/api/client";
import { getSavedAuthUser, saveAuthUser } from "../../../core/storage/sessionStorage";
import { clearContaApiCaches } from "../../conta/services/contaService";
import { getAccountProfile, login as loginRequest } from "../services/authService";
import type { AuthUser } from "../types/auth";

function formatCpfFromDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  return "";
}

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  bootstrapDone: boolean;
  bootstrap: () => Promise<void>;
  login: (emailCpf: string, senha: string, lembrar: boolean) => Promise<void>;
  logout: () => Promise<void>;
  /** Atualiza JWT após refresh na API (persistência + estado). */
  applyRefreshedToken: (token: string) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  bootstrapDone: false,
  bootstrap: async () => {
    try {
      const saved = await getSavedAuthUser();
      setApiAuthToken(saved?.token ?? null);
      let user = saved;
      if (saved?.token) {
        try {
          const profile = await getAccountProfile();
          user = {
            ...saved,
            ...(profile.id ? { id: profile.id } : {}),
            ...(profile.nome ? { nome: profile.nome } : {}),
            ...(profile.email ? { email: profile.email } : {}),
            ...(profile.cpf ? { cpf: profile.cpf } : {}),
            loginId: profile.loginId || saved.loginId,
          };
          await saveAuthUser(user);
        } catch {
          /* offline ou /me indisponível: mantém sessão salva */
        }
      }
      set({ user });
    } catch (error) {
      console.warn("Auth bootstrap failed:", error);
      setApiAuthToken(null);
      set({ user: null });
    } finally {
      set({ bootstrapDone: true });
    }
  },
  login: async (emailCpf, senha, lembrar) => {
    set({ loading: true });
    try {
      const user = await loginRequest({ emailCpf, senha, lembrar });
      // Set token first so follow-up protected requests (e.g. /account/me) are authenticated.
      setApiAuthToken(user.token ?? null);
      try {
        const profile = await getAccountProfile();
        if (profile.nome) user.nome = profile.nome;
        if (profile.email) user.email = profile.email;
        if (profile.cpf) user.cpf = profile.cpf;
        if (profile.loginId) user.loginId = profile.loginId;
        if (profile.id) user.id = profile.id;
      } catch {
        /* offline: mantém dados do JWT */
      }
      user.loginId = user.loginId || user.email || user.cpf;
      if (!user.cpf && !emailCpf.includes("@")) {
        const formatted = formatCpfFromDigits(emailCpf);
        if (formatted) user.cpf = formatted;
      }
      const toSave: AuthUser = { ...user, lembrar, senha: lembrar ? user.senha : undefined };
      await saveAuthUser(toSave);
      set({ user: toSave, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  logout: async () => {
    setApiAuthToken(null);
    clearContaApiCaches();
    await saveAuthUser(null);
    set({ user: null });
  },
  applyRefreshedToken: async (token) => {
    setApiAuthToken(token);
    const base = get().user ?? (await getSavedAuthUser());
    if (!base) return;
    const updated: AuthUser = { ...base, token };
    await saveAuthUser(updated);
    set({ user: updated });
  },
}));
