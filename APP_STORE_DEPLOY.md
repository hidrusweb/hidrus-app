# Deploy iOS (App Store) - Hidrus App Native

Este documento centraliza o processo para publicar o app iOS na Apple App Store, com checklist de alteracoes da release e passo a passo de implantacao.

## 1) Objetivo

- Padronizar publicacao no iOS (TestFlight + App Store).
- Garantir rastreabilidade das alteracoes de cada versao.
- Reduzir erro manual em certificados, build e submissao.

## 2) Pre-requisitos

- Conta Apple Developer ativa.
- Acesso ao App Store Connect do app.
- EAS CLI instalado:

```bash
npm i -g eas-cli
```

- Login no Expo/EAS:

```bash
eas login
```

- Projeto com dependencias instaladas:

```bash
npm install
```

## 3) Checklist de alteracoes da release

Preencha antes de subir build:

### 3.1 Informacoes da release

- Versao marketing (`expo.version`): `x.y.z`
- Build iOS (`ios.buildNumber`): `N` (sempre incrementar)
- Data da release: `dd/mm/aaaa`
- Responsavel: `nome`
- Branch/tag: `branch` / `tag`

### 3.2 Alteracoes funcionais

- [ ] Fluxo de contas/historico atualizado
- [ ] Ajustes visuais de header/top navbar
- [ ] Ajustes de grafico de consumo (barras, cores, valores)
- [ ] Ajustes de usabilidade/acessibilidade

### 3.3 Alteracoes tecnicas

- [ ] `npm run typecheck` sem erros
- [ ] Testes manuais executados em iPhone real
- [ ] Variaveis de ambiente revisadas
- [ ] Dependencias revisadas/removidas sem uso

### 3.4 Evidencias

- [ ] Prints da tela principal
- [ ] Prints da tela de historico/evolucao
- [ ] Video curto do fluxo principal
- [ ] Resultado de QA/UAT aprovado

## 4) Configuracoes obrigatorias no Expo

No `app.json`, garantir:

- `expo.version` atualizado (ex.: `1.0.1`)
- `expo.ios.buildNumber` incrementado (ex.: `2`, `3`, `4`...)
- Bundle Identifier definido em `expo.ios.bundleIdentifier`

Exemplo:

```json
{
  "expo": {
    "version": "1.0.1",
    "ios": {
      "bundleIdentifier": "br.com.hidrus.app",
      "buildNumber": "2"
    }
  }
}
```

## 5) Configurar EAS Build (primeira vez ou ajuste)

Se ainda nao existir `eas.json`:

```bash
eas build:configure
```

Sugestao de profiles:

- `preview`: distribuicao interna/TestFlight
- `production`: release oficial

## 6) Validacoes antes do build

Executar:

```bash
npm run typecheck
npx expo-doctor
```

Validar no iOS local:

```bash
npm run ios
```

## 7) Gerar build iOS

### 7.1 Build para TestFlight (recomendado)

```bash
eas build --platform ios --profile production
```

### 7.2 Enviar build para App Store Connect

Se o profile ja estiver com submit automatico, o envio ocorre sozinho.
Se nao, executar:

```bash
eas submit --platform ios --profile production
```

## 8) Processo no App Store Connect

1. Abrir o app em **App Store Connect**.
2. Em **TestFlight**, aguardar processamento da build.
3. Distribuir para teste interno/externo.
4. Validar checklist de QA.
5. Criar nova versao em **App Store**.
6. Preencher metadados:
   - Whats New (notas da versao)
   - Descricao curta/longa
   - Screenshots por dispositivo
   - Categoria e classificacao
   - Privacy policy URL
7. Associar build aprovada.
8. Enviar para **App Review**.

## 9) Template de notas da versao

Use no App Store Connect:

```text
Novidades desta versao:
- Melhorias visuais no historico e navegacao superior.
- Novo grafico de consumo mensal em barras, com destaque de valores.
- Ajustes de alinhamento, legibilidade e estabilidade geral.
```

## 10) Checklist de publicacao (Go/No-Go)

- [ ] Build aprovada em TestFlight
- [ ] QA funcional aprovado
- [ ] Sem erros criticos em monitoramento
- [ ] Metadados e screenshots revisados
- [ ] Aprovacao de produto/negocio
- [ ] Submissao feita para App Review

## 11) Pos-deploy

- Monitorar crashes e feedback nas primeiras 24-48h.
- Registrar versao publicada, data e responsavel.
- Criar changelog interno da release.

## 12) Problemas comuns

- **Build rejeitada por versao/buildNumber**: incrementar `ios.buildNumber`.
- **Erro de assinatura**: revalidar certificados/profiles no EAS.
- **Review rejeitada por metadata**: ajustar descricao, screenshots ou privacidade.
- **Comportamento diferente no iPhone**: validar em dispositivo fisico e iOS atual.

---

## Anexo A - Registro rapido da release (copiar e preencher)

```text
Release iOS: vX.Y.Z (build N)
Data: dd/mm/aaaa
Responsavel: nome

Alteracoes:
1)
2)
3)

QA:
- iPhone modelo:
- iOS versao:
- Status:

Resultado:
- TestFlight: OK / NOK
- App Review: Enviado / Aprovado / Rejeitado
```
