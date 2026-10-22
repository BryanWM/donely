# 001 · App local, com servidor próprio e SQLite

Data: 21/10/2026 · Situação: aceita

## Contexto

O primeiro produto é o **quadro pessoal**: uma pessoa organiza as próprias tarefas. Requisitos:

1. Qualquer pessoa clona o repositório e usa sozinha, no navegador, sem criar conta em serviço nenhum.
2. Integrações virão depois. A primeira é o **Notion**: puxar os cards atribuídos à pessoa.

## Decisão

Um app que roda na máquina da pessoa:

- **Servidor local:** Node 22 + [Hono](https://hono.dev). Serve a API, a interface e, no futuro, os conectores.
- **Banco:** SQLite pelo módulo `node:sqlite`, que já vem no Node 22. Um arquivo em `app/dados/donely.db`. Sem dependência nativa para compilar.
- **Interface:** React + Vite, em TypeScript.
- **Segurança:** o servidor escuta só em `127.0.0.1`, porque não há login. Tokens de integração ficam no `.env` local e nunca vão para o navegador.

## Por que não as outras opções

- **Supabase + Vercel** (stack do plano original e do wrmax-metrics): exige conta, projeto e chaves. Vai contra o requisito 1. Faz sentido de novo se surgir uma versão de equipe na nuvem.
- **App só no navegador** (dados no IndexedDB, sem servidor): não atende ao requisito 2. A API do Notion bloqueia chamadas diretas do navegador (CORS) e o token ficaria exposto na página.
- **App de desktop** (Electron, Tauri): o pedido é usar no navegador. Instalador e atualização trazem um custo que não se justifica agora.

## Como as integrações entram

Cada integração é um **conector** em `app/src/server/integracoes/`, que segue a mesma interface (`Conector`). Cada tarefa guarda a sua origem (`origem`, `origem_id`, `origem_url`), e a combinação origem + id é única no banco. Assim, sincronizar de novo atualiza o card em vez de duplicar, e no futuro dá para devolver o status ao Notion.

## Consequências

- Os dados ficam numa máquina só. Backup é copiar `app/dados/`. Sincronizar entre dispositivos fica para depois.
- O `node:sqlite` ainda é marcado como experimental no Node 22 e mostra um aviso ao iniciar. A API usada é estável e simples, e trocar por `better-sqlite3` é uma mudança de um arquivo, se for preciso.
- O plano de arquitetura (`docs/PLANO.md`) descreve a versão de equipe na nuvem e não vale para este produto.
