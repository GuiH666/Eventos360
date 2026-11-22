# Eventos 360

[![CI](https://github.com/GuiH666/Eventos360/actions/workflows/ci.yml/badge.svg)](https://github.com/GuiH666/Eventos360/actions/workflows/ci.yml) ![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)

Aplicativo mobile que **centraliza e organiza eventos** (palestras, oficinas, hackathons, semanas acadêmicas e eventos profissionais) para estudantes. Feito em **React Native + Expo + TypeScript** para a avaliação A2 de Programação para Dispositivos Móveis (Grupo 8).

## O que o app faz

| Requisito do Grupo 8 | Onde está |
|---|---|
| Lista de eventos futuros usando FlatList | aba **Eventos** (`app/(tabs)/index.tsx`) |
| Tela de detalhes do evento | `app/evento/[id].tsx` |
| Pesquisa por categoria, data ou modalidade | `src/components/FiltrosEventos.tsx` + `src/utils/filtros.ts` |
| Formulário de inscrição / manifestação de interesse | `app/inscricao/[id].tsx` (validação em `src/utils/validacao.ts`) |
| Persistência de eventos favoritos | SQLite (`src/database/banco.ts`, `src/services/favoritosService.ts`) |
| Consumo de API REST com eventos | `src/services/apiEventos.ts` |
| Tratamento de eventos encerrados ou indisponíveis | `src/utils/disponibilidade.ts` + telas |
| Notificação local para lembrar favoritos | `src/services/lembretes.ts` (expo-notifications) |

Telas: **Eventos**, **Favoritos**, **Inscrições**, **Ajustes** (abas) + **Detalhes** e **Inscrição** (empilhadas).

## Como rodar

```bash
npm install
npx expo install --fix        # alinha as versões das bibliotecas ao SDK
npx expo start --dev-client   # precisa do Development Build instalado (veja docs/GUIA_BUILDS.md)
```

> Notificações locais funcionam no Development Build / APK. O Expo Go tem limitações com `expo-notifications`.

## Testes

As regras que não dependem do aparelho (validação do formulário, datas em português, disponibilidade do evento e filtros da lista) têm testes automáticos com [Vitest](https://vitest.dev/):

```bash
npm test            # testes
npm run typecheck   # TypeScript
npm run lint        # ESLint
```

Os testes ficam em `src/utils/__tests__/` e o GitHub Actions roda os três comandos a cada push. O roteiro de teste manual no aparelho está em [docs/CHECKLIST_TESTES.md](docs/CHECKLIST_TESTES.md).

## API REST

O app faz `GET` em um endpoint que devolve JSON. Por padrão usa o arquivo [`api/eventos.json`](api/eventos.json) servido pelo GitHub:

```
https://raw.githubusercontent.com/GuiH666/Eventos360/main/api/eventos.json
```

> O repositório precisa ser **público** e o nome/usuário na URL precisam bater com o seu. Se forem diferentes, ajuste `API_EVENTOS` em `src/config.ts` ou crie um arquivo `.env.local` com `EXPO_PUBLIC_API_EVENTOS=<url>`.

Formato da resposta:

```json
{
  "versao": 1,
  "atualizadoEm": "2026-11-12T12:00:00-03:00",
  "eventos": [
    {
      "id": "ev-006",
      "titulo": "Oficina de React Native com Expo",
      "descricao": "Construa um app do zero ...",
      "categoria": "Oficina",
      "modalidade": "Presencial",
      "inicio": "2026-11-19T14:00:00-03:00",
      "fim": "2026-11-19T18:00:00-03:00",
      "local": "Laboratório 3",
      "organizador": "Laboratório de Desenvolvimento",
      "vagas": 30,
      "vagasRestantes": 6,
      "gratuito": true,
      "preco": 0,
      "situacao": "confirmado",
      "inscricoesAte": "2026-11-18T23:59:00-03:00",
      "tags": ["react native", "expo"]
    }
  ]
}
```

Campos: `categoria` ∈ Palestra, Oficina, Hackathon, Semana acadêmica, Profissional · `modalidade` ∈ Presencial, Online, Híbrido · `situacao` ∈ confirmado, cancelado.

### Servidor local (opcional)

`api/servidor.mjs` é a mesma API como servidor HTTP, sem dependências, com filtros:

```bash
npm run api                              # http://localhost:3000/eventos
ATRASO=3000 npm run api                  # simula API lenta (para ver o carregamento)
```

Endpoints: `GET /eventos` (aceita `?categoria=`, `?modalidade=`, `?q=`), `GET /eventos/:id`, `GET /saude`. Para o celular, use o IP do computador: `EXPO_PUBLIC_API_EVENTOS=http://192.168.0.10:3000/eventos`.

### Estados da lista de eventos

| Situação | O que o usuário vê |
|---|---|
| Carregando (1ª vez) | esqueleto animado |
| Sucesso | lista com busca e filtros |
| Sem dados (API devolveu lista vazia) | "Nenhum evento publicado" + Atualizar |
| Nada combina com a busca | "Nenhum evento encontrado" + Limpar filtros |
| Erro de comunicação **com** cópia salva | faixa "Sem conexão… mostrando eventos salvos em dd/mm" |
| Erro de comunicação **sem** cópia | tela de erro com "Tentar novamente" |

## Estrutura

```
app/                      telas e rotas (Expo Router)
  (tabs)/                 Eventos, Favoritos, Inscrições, Ajustes
  evento/[id].tsx         detalhes
  inscricao/[id].tsx      formulário (modal)
  _layout.tsx             tema, provider de eventos, toque em notificação
api/                      eventos.json (dados) e servidor.mjs (API local)
src/
  components/             EventoCard, FiltrosEventos, Selo, BannerAviso, TabBar, ui/
  database/banco.ts       SQLite: tabelas e migração
  hooks/                  useCarregar
  services/               apiEventos, lembretes, favoritos, inscrições, cache, preferências
  state/EventosContext    estado compartilhado (eventos, favoritos, lembretes)
  theme/                  paletas clara/escura, tokens
  types/                  tipos TypeScript
  utils/                  datas, filtros, validação, disponibilidade, plataforma(.android/.ios)
docs/                     guia de builds, checklist de testes
```

## Recursos do dispositivo e permissões

- **Notificações locais** (`expo-notifications`): lembrete antes do evento favorito. A permissão é explicada **antes** de pedir; se for negada de vez, o app orienta e abre as configurações do sistema. Ajustes → "Enviar notificação de teste" confirma que está tudo certo.
- **Vibração** (`expo-haptics`) e **compartilhar** (`Share`) como apoio.

## Diferenças entre Android e iOS

- Canal de notificação só no Android (`Platform.OS`).
- `KeyboardAvoidingView` com `padding` (iOS) ou `height` (Android) via `Platform.select`.
- Compartilhamento: no iOS o link vai no campo `url`.
- Textos de ajuda por plataforma em arquivos `src/utils/plataforma.android.ts` / `plataforma.ios.ts`.

## Builds

Veja [docs/GUIA_BUILDS.md](docs/GUIA_BUILDS.md) (Development Build, APK, AAB, assinatura, versionamento) e [docs/CHECKLIST_TESTES.md](docs/CHECKLIST_TESTES.md).

## Autor

Guilherme Bomfim Ribeiro — Análise e Desenvolvimento de Sistemas · [GitHub](https://github.com/GuiH666)
