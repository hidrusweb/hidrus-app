import { create } from "zustand";
import { setApiAuthToken } from "../../../core/api/client";
import { getSavedAuthUser, saveAuthUser } from "../../../core/storage/sessionStorage";
import { getAccountProfile, login as loginRequest } from "../services/authService";
import type { AuthUser } from "../types/auth";

function formatCpfCnpjFromDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }
  return "";
}

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  bootstrapDone: boolean;
  bootstrap: () => Promise<void>;
  login: (cpf: string, senha: string, lembrar: boolean) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
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
          if (saved.lembrar) await saveAuthUser(user);
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
  login: async (cpf, senha, lembrar) => {
    set({ loading: true });
    try {
      const user = await loginRequest({ emailCpf: cpf, senha, lembrar });
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
      if (!user.cpf) {
        const formatted = formatCpfCnpjFromDigits(cpf);
        if (formatted) user.cpf = formatted;
      }
      await saveAuthUser(lembrar ? user : null);
      set({ user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  logout: async () => {
    setApiAuthToken(null);
    await saveAuthUser(null);
    set({ user: null });
  },
}));
