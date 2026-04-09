# Publicacao do Hidrus React Native na Play Store

Este documento lista o que precisa ser configurado para publicar o app React Native (Expo) como substituicao da versao legado em Flutter.

## 1) Decisoes obrigatorias antes do release

- Manter o **mesmo Application ID** da versao Flutter na Play Store (ex.: `br.com.suaempresa.hidrus`), para atualizar o app existente.
- Confirmar a conta Play Console (owner/admin) e o app alvo correto.
- Definir estrategia de rollout: `internal` -> `closed` -> `production` (recomendado) ou direto em `production`.

## 2) Configuracoes no app (Expo)

No arquivo `app.json`, revisar e ajustar:

- `expo.name`: nome exibido para usuario.
- `expo.slug`: identificador interno do projeto Expo.
- `expo.version`: versao semantica exibida (ex.: `1.2.0`).
- `expo.android.package`: **deve ser o mesmo package da versao Flutter publicada**.
- `expo.android.versionCode`: inteiro crescente (se usar `autoIncrement` no EAS, ele sobe automaticamente).
- `expo.android.adaptiveIcon`: icone foreground/background final para Play.

Exemplo minimo para Android (adaptar para seus dados):

```json
{
  "expo": {
    "name": "Hidrus",
    "version": "1.2.0",
    "android": {
      "package": "br.com.suaempresa.hidrus",
      "versionCode": 120,
      "adaptiveIcon": {
        "foregroundImage": "./assets/logo-hydrus-only-image.png",
        "backgroundColor": "#000000"
      }
    }
  }
}
```

## 3) Configuracoes no EAS

Arquivo `eas.json` (ja preparado neste projeto):

- Build profile `production` com `autoIncrement: true`.
- Submit profile `production` com:
  - `serviceAccountKeyPath: "./.secrets/google-play-service-account.json"`
  - `track: "production"`
  - `releaseStatus: "completed"`

## 4) Credenciais e acessos necessarios

### 4.1 Expo

- Criar token em **expo.dev** -> **Account** -> **Access Tokens** (ou `eas login` + painel).
- Salvar no GitHub Secret: `EXPO_TOKEN`.

### 4.2 Google Play

1. No Google Cloud, criar Service Account.
2. Gerar chave JSON da conta de servico.
3. No Play Console:
   - `Setup -> API access` e vincular o projeto.
   - Conceder permissao para a service account no app (release manager/admin conforme politica interna).
4. Salvar a chave no GitHub (use **um** dos dois):
   - `GOOGLE_SERVICE_ACCOUNT_JSON`: conteudo **exato** do arquivo `.json` baixado (deve comecar com `{` e ter `"type": "service_account"` com aspas).
   - **Ou** `GOOGLE_SERVICE_ACCOUNT_JSON_B64`: o mesmo arquivo codificado em Base64 (evita problemas ao colar multilinha). No Mac use redirecionamento (o `-i` do Linux nao e o mesmo): `base64 < caminho/para/chave.json | tr -d '\n' | pbcopy` (uma linha so, ideal para secret).

Se o secret estiver em formato `type: service_account` **sem aspas**, nao e JSON valido e o submit falha. Sempre copie do arquivo original do Google Cloud.

## 5) Pipeline CI/CD (GitHub Actions)

Pipeline criada em `.github/workflows/release-android-play-store.yml`.

Ela executa:

1. Checkout e setup Node.
2. Instala dependencias com `npm ci`.
3. Gera arquivo local `.secrets/google-play-service-account.json` a partir do secret.
4. Faz build Android AAB no EAS (`production`).
5. Envia para Play Store com `eas submit --latest`.

### 5.1 Como disparar

- Manual: aba **Actions** -> workflow **Android Release to Play Store (EAS)** -> **Run workflow**.
- Automatico: push em `main` (conforme regra atual do workflow).

## 6) Primeira publicacao com seguranca (recomendado)

Para reduzir risco na troca Flutter -> React Native:

1. Trocar o track para `internal` no submit.
2. Validar login, leitura de conta, pagamentos/faturas e notificacoes.
3. Subir para `closed testing`.
4. Fazer rollout gradual em `production` (5%, 20%, 50%, 100%).

## 7) Checklist final de release

- [ ] `android.package` igual ao app legado da Play Store.
- [ ] Permissoes Android revisadas.
- [ ] `version` e `versionCode` corretos.
- [ ] EXPO_TOKEN configurado no GitHub.
- [ ] GOOGLE_SERVICE_ACCOUNT_JSON configurado no GitHub.
- [ ] Build `production` concluido sem erro.
- [ ] Submit para track correto.
- [ ] Validacao pos-publicacao (crash, login, APIs, metricas).

## 8) Comandos uteis locais

```bash
npx eas whoami
npx eas build --platform android --profile production
npx eas submit --platform android --profile production --latest
```

