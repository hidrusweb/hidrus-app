import type { Unidade } from "../features/conta/types/conta";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  RecoverValidate: undefined;
  RecoverPassword: { cpfCnpj: string };
};

export type AppStackParamList = {
  GenerateBill: undefined;
  Profile: undefined;
  BillTabs: { unidade: Unidade };
};
