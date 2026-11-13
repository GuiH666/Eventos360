# Guia de builds — Eventos 360

Comandos para PowerShell/Windows, na pasta do projeto. Tudo usa o **EAS Build** (a compilação acontece na nuvem da Expo).

## 0. Preparação (uma vez)

```powershell
npm install
npx expo install --fix          # alinha versões ao SDK (inclui expo-notifications e expo-dev-client)
npx expo-doctor                 # deve terminar sem erros
npm install -g eas-cli          # se ainda não tiver
eas login
eas init                        # cria o projeto no EAS e grava o projectId no app.json
```

Publique o código em um repositório **público** do GitHub (a API de eventos é o arquivo `api/eventos.json` servido pelo GitHub — veja o README). Confira a URL abrindo-a no navegador do celular.

Se o `eas build` reclamar do Git (erro 128 / tarball):

```powershell
$env:EAS_NO_VCS = 1
```

## 1. Development Build (obrigatório)

É um app "de desenvolvimento" com o seu código nativo (notificações, SQLite etc.), que carrega o JavaScript do Metro.

```powershell
eas build --platform android --profile development
```

1. Ao terminar, abra o link do build no celular Android e instale o `.apk` (permita "instalar de fontes desconhecidas").
2. No computador: `npx expo start --dev-client` e abra o app instalado (ele encontra o servidor pelo QR code / mesma rede Wi-Fi).
3. **Evidências para o relatório:** print da página do build no EAS (status *Finished*), print do app aberto no celular e do comando `npx expo start --dev-client`.

O perfil `development` está em `eas.json` (`developmentClient: true`, `distribution: internal`, `buildType: apk`).

## 2. APK de distribuição (instalável)

```powershell
eas build --platform android --profile preview
```

- Gera um **.apk** assinado, que qualquer Android instala direto.
- Na página do build há o **link de download** e um QR code. Baixe o arquivo (botão *Download*) para anexar na entrega.
- Instale no celular e rode o [checklist de testes](CHECKLIST_TESTES.md) **neste APK**.

## 3. AAB de produção

```powershell
eas build --platform android --profile production
```

- Gera um **.aab** (Android App Bundle), o formato exigido pela Google Play.
- O perfil `production` usa `buildType: app-bundle` e `autoIncrement: true` (o `versionCode` sobe sozinho a cada build).
- Entregue o arquivo `.aab` ou o link da página do build no EAS.
- (Opcional) publicar: `eas submit --platform android --profile production` (exige conta Google Play Console).

## 4. Assinatura Android (conceito + onde está no projeto)

- Todo app Android precisa ser **assinado digitalmente** com uma chave privada (*keystore*). A assinatura prova quem é o autor e garante que as atualizações vêm da mesma origem — uma versão assinada com outra chave **não atualiza** a anterior.
- No primeiro build, o EAS **gera e guarda a keystore** na conta Expo (credenciais "remotas"). Nada de chave dentro do repositório.
- Ver/baixar backup: `eas credentials` → Android → escolha o perfil → *Keystore*. Guarde o backup fora do Git.
- Ao publicar na Google Play, há duas chaves: a **chave de upload** (a do EAS, usada para enviar o `.aab`) e a **chave de assinatura do app** (guardada pela Google quando se ativa o *Play App Signing*).
- O `.gitignore` já bloqueia `*.jks`, `*.keystore`, `*.p12`, `*.key`. **Nunca** coloque keystore, senhas ou `credentials.json` no relatório ou no ZIP.
- Para mostrar a impressão digital (SHA-1/SHA-256) na defesa: `eas credentials` mostra os fingerprints da keystore.

## 5. Versionamento

| Campo | Onde | Significado |
|---|---|---|
| `version` | `app.json` (`1.0.0`) | **versionName**: o que o usuário vê. Siga *MAJOR.MINOR.PATCH*. |
| `versionCode` | gerenciado pelo EAS (`appVersionSource: "remote"`) | número inteiro que **sempre aumenta**; a Play Store recusa um `.aab` com `versionCode` repetido. |

- `eas.json` → `cli.appVersionSource: "remote"` e `production.autoIncrement: true`.
- Consultar: `eas build:version:get -p android`.
- Regra prática: correção pequena → `1.0.1`; funcionalidade nova → `1.1.0`; mudança grande → `2.0.0`. Faça a mudança em `version` **antes** do build.

## 6. Testes antes de publicar

1. `npx tsc --noEmit` (tipos) e `npx expo lint`.
2. `npx expo-doctor`.
3. Testar o **APK** (perfil preview) em aparelho real com o [checklist](CHECKLIST_TESTES.md): online, **modo avião**, permissão de notificação negada/concedida, tema claro/escuro, rotação de tela bloqueada, 1ª abertura sem internet.
4. Só então gerar o **AAB** de produção.
5. Para testar o `.aab` antes da loja: faixa de **teste interno** da Play Console, ou `bundletool build-apks --bundle=app.aab --output=app.apks --mode=universal`.

## 7. Problemas comuns

| Sintoma | Solução |
|---|---|
| `Unable to resolve module ../../src/...` | Você substituiu uma pasta em vez de mesclar arquivos. Restaure os arquivos que faltam. |
| `ERESOLVE` ao instalar | `npm install --legacy-peer-deps` e depois `npx expo install --fix`. |
| Lista de eventos mostra erro de comunicação | Repositório privado ou URL errada em `src/config.ts`. Abra a URL no navegador do celular. |
| Notificação de teste não aparece | Ajustes → permissão "Ativa"? Nas configurações do Android, ative *Notificações* do app e o canal *Lembretes de eventos*. |
| Build trava na etapa de Git | `$env:EAS_NO_VCS = 1` e rode de novo. |
