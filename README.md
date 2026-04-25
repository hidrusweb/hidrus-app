# Hidrus App (Mobile)

Aplicativo mobile do Hidrus para condôminos, desenvolvido em React Native com Expo e TypeScript.

## Stack

- Expo SDK 54
- React Native 0.81
- React 19
- React Navigation
- React Hook Form + Zod
- Zustand e AsyncStorage

## Requisitos

- Node.js 20.19+
- npm 10+
- Android Studio (Android) e/ou Xcode (iOS)
- Expo CLI / EAS CLI (para builds)

## Configuração

```bash
npm install
cp .env.example .env
```

Variáveis principais no `.env`:

- `EXPO_PUBLIC_API_URL`: URL da API
- `EXPO_PUBLIC_API_MODE`: `remote`, `local_ios` ou `local_android`
- `EXPO_PUBLIC_APP_BEARER_TOKEN`: token opcional para cenários específicos

## Execução local

```bash
npm run start
npm run android
npm run ios
```

## Scripts úteis

```bash
npm run web
npm run typecheck
```

## Estrutura do projeto

- `src/core`: infraestrutura (api, env, tema, storage)
- `src/features/auth`: autenticação
- `src/features/conta`: geração e visualização da conta
- `src/navigation`: navegação (stacks/tabs)

## Build com EAS

Perfis configurados no `eas.json`:

- `development` e `preview`: API de desenvolvimento (`https://apidev.hidrusweb.com/api`)
- `production`: API de produção (`https://api.hidrusweb.com/api`)

Comandos:

```bash
npx eas build --platform android --profile preview
npx eas build --platform ios --profile preview
npx eas build --platform android --profile production
```

## Build sem EAS

Comandos:

```bash
cd android && ./gradlew bundleRelease
cd android && ./gradlew assembleRelease
```

## Publicação Android (Play Store)

O projeto possui workflow em `.github/workflows/release-android-play-store.yml` com submit configurado via `eas.json`.
