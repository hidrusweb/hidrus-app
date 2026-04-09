export type AuthUser = {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  loginId?: string;
  senha?: string;
  lembrar: boolean;
  token?: string;
};

export type LoginInput = {
  emailCpf: string;
  senha: string;
  lembrar: boolean;
};
