# Arquitetura

O DONELY é um app local: um servidor Node na máquina da pessoa serve a interface e a API, e guarda tudo num arquivo SQLite. Não há login nem nuvem.

## Por que um app local

O DONELY é um quadro de uma pessoa só. Qualquer um clona o repositório e usa no navegador, sem criar conta em serviço nenhum. Daí a escolha:

- **Servidor local (Node + Hono):** serve a API e a interface, e escuta só nesta máquina.
- **SQLite pelo `node:sqlite`:** o banco é um arquivo, `app/dados/donely.db`. Já vem no Node 22, sem dependência nativa para compilar. Backup é copiar a pasta.
- **React + Vite, em TypeScript:** a interface.

Opções descartadas:

- **Banco na nuvem com hospedagem (Supabase, Vercel e afins):** exigiria conta, projeto e chaves, o contrário de "clonar e usar".
- **App só no navegador (dados no IndexedDB):** sem servidor não há onde guardar arquivos grandes com segurança nem como evoluir para outras funções do lado do servidor.
- **App de desktop (Electron, Tauri):** instalador e atualização trazem um custo que não se paga para um quadro pessoal.

Consequências: os dados ficam numa máquina só (sincronizar entre dispositivos não existe), e o `node:sqlite` ainda mostra um aviso de "experimental" ao iniciar. A parte usada é estável, e trocar por `better-sqlite3` mudaria um arquivo só.

## Visão geral

```
navegador (React)  ──HTTP──▶  servidor local (Hono, 127.0.0.1:3333)  ──▶  SQLite (app/dados/donely.db)
```

- **Interface:** React 19 + Vite, em TypeScript. Em produção (`npm start`), o próprio servidor entrega a interface compilada. Em desenvolvimento (`npm run dev`), o Vite serve a interface em `localhost:5173` e repassa `/api` ao servidor.
- **Servidor:** Node 22.13+ com [Hono](https://hono.dev). Escuta só em `127.0.0.1`.
- **Banco:** SQLite pelo módulo `node:sqlite`, que já vem no Node. Sem dependência nativa para compilar.
- **Validação:** toda entrada da API passa por [Zod](https://zod.dev).
- **Tipos e regras compartilhados:** `src/shared/dominio.ts` é usado pelo servidor e pela interface, para as regras (prazo, ordem, arquivamento) serem as mesmas nos dois lados.

## Pastas

```
app/
├─ src/
│  ├─ shared/
│  │  └─ dominio.ts            tipos, constantes e regras puras (prazo, ordem do quadro, arquivamento, períodos)
│  ├─ server/
│  │  ├─ index.ts              ponto de entrada: lê o .env, abre o banco, monta a API e serve a interface
│  │  ├─ api.ts                rotas /api, validação com Zod e proteção de acesso local
│  │  ├─ repositorio.ts        toda leitura e escrita no banco
│  │  └─ db.ts                 abertura do SQLite e migrações
│  └─ client/
│     ├─ main.tsx              monta o React e carrega as fontes
│     ├─ App.tsx               estado global, abas, cabeçalho, ações e janelas
│     ├─ api.ts                chamadas ao servidor
│     ├─ acoes.ts              contrato das ações que os componentes recebem
│     ├─ voo.ts                animação da linha que viaja até a aba de destino
│     ├─ estilos.css           todos os estilos (tokens em :root)
│     └─ componentes/          Quadro, Cartao, ModalTarefa, ModalNova, CapturaRapida, Demandas,
│                              Historico, Configuracoes, Comemoracao, Anexos, Modal, Icone
├─ dados/                      o banco (fora do git)
└─ .env                        opcional: PORT e DONELY_DB (fora do git)
```

## Fluxo de dados

1. Ao abrir, a interface pede `GET /api/estado`, que devolve tudo de uma vez: tarefas, demandas, configuração e clientes.
2. Cada ação chama uma rota específica (por exemplo, `POST /api/tarefas/:id/mover`). A resposta traz a tarefa atualizada, e a interface troca só aquela tarefa no estado.
3. Regras de exibição, como a ordem da lista, o selo de prazo e o que já foi para o Histórico, são calculadas na interface com as funções de `dominio.ts`. O banco guarda só os fatos (status, datas).

## Banco de dados

Um arquivo SQLite, com chaves estrangeiras ligadas e exclusão em cascata: apagar uma tarefa apaga o checklist, os links, os anexos e os eventos dela.

| Tabela | O que guarda |
|---|---|
| `tarefas` | A tarefa: título, briefing (`notas`), cliente, tipo, prioridade, prazo, status, datas de conclusão e arquivamento. |
| `checklist` | Itens do checklist de cada tarefa. |
| `links` | Links de cada tarefa. |
| `anexos` | Arquivos (o conteúdo fica no próprio banco). `papel` separa `material` de `referencia`. |
| `eventos` | O histórico de cada tarefa ("Moveu para Fazendo", "Prazo: 27/10"…). |
| `demandas` | Os pedidos da Captura rápida, com o tempo cronometrado. |
| `clientes` | Os nomes dos clientes. |
| `config` | Configurações: prazo de arquivamento, tema e tipos. |

**Migrações:** ficam numa lista em `db.ts`, aplicadas em ordem na abertura do banco. Para mudar o banco, adicione uma migração nova ao fim da lista; nunca edite uma que já existe.

## Segurança

O servidor não tem login. Ele confia só na própria máquina:

- Escuta apenas em `127.0.0.1`.
- Recusa pedidos cujo `Host` não seja `localhost`, `127.0.0.1` ou `[::1]`. Isso protege contra DNS rebinding.
- Recusa pedidos com `Origin` de outro site, para que uma página aberta no navegador não chame a API.
- Recusa pedidos que chegam por túnel ou proxy (cabeçalhos `cf-connecting-ip`, `x-forwarded-for`, `forwarded`).
- Anexos têm limite de 100 MB.
