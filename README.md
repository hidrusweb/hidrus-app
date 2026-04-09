# Hidrus App Native

Migracao do app Flutter para React Native com Expo + TypeScript.

## Requisitos

- Node 20.19+ (recomendado pelo Expo SDK 54 / RN 0.81)
- npm 10+

## Setup

```bash
npm install
cp .env.example .env
```

## Rodando

```bash
npm run start
npm run android
npm run ios
```

## Estrutura

- `src/core`: infra (api, env, tema, storage)
- `src/features/auth`: fluxo de autenticacao
- `src/features/conta`: fluxo de geracao e exibicao da conta
- `src/navigation`: stacks e tabs

## Build (EAS)

```bash
npx eas build --platform android --profile preview
npx eas build --platform ios --profile preview
```
