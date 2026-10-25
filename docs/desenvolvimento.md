# Desenvolvimento

## Requisitos

- Node **22.13 ou mais novo** (o app usa o `node:sqlite` embutido e `process.loadEnvFile`).
- npm.

## Rodar

```bash
cd app
npm install
npm run dev
```

O comando sobe duas coisas juntas:

- o servidor em `http://localhost:3333`, que reinicia sozinho quando o código do servidor muda;
- a interface em **http://localhost:5173**, com recarga automática. Use este endereço enquanto desenvolve: ele repassa `/api` para o servidor.

Para usar como no dia a dia (interface compilada, servida pelo próprio servidor):

```bash
npm start
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor e interface em modo de desenvolvimento. |
| `npm start` | Compila a interface e sobe o servidor em `:3333`. |
| `npm run build` | Só compila a interface para `dist/client`. |
| `npm test` | Roda os testes (Vitest). |
| `npm run typecheck` | Checa os tipos (TypeScript). |

Na raiz do repositório:

| Comando | O que faz |
|---|---|
| `npm run marca` | Gera os SVG e PNG da marca em `brand/`. |
| `npm run paleta` | Gera `brand/tokens/cores.css` a partir da paleta. Não edite esse arquivo à mão. |

## Configuração

Tudo é opcional. Copie `app/.env.example` para `app/.env`:

| Variável | Padrão | Para quê |
|---|---|---|
| `PORT` | `3333` | Porta do servidor. |
| `DONELY_DB` | `app/dados/donely.db` | Arquivo do banco. Útil para testar com uma cópia. |
| `DONELY_PGID` | — | Definida pelo `scripts/iniciar.sh` (o atalho): o grupo de processos do app. Com ela, a rota `/desligar` e o botão Desligar passam a existir. Não defina à mão. |

Para testar sem mexer nos seus dados, suba um servidor com um banco à parte:

```bash
PORT=3399 DONELY_DB=/tmp/donely-teste.db npx tsx src/server/index.ts
```

## Testes

Os testes ficam ao lado do código:

| Arquivo | O que cobre |
|---|---|
| `src/shared/dominio.test.ts` | Regras puras: prazo, ordem do quadro, arquivamento, períodos. |
| `src/server/api.test.ts` | Rotas da API, validação e proteção de acesso local. |

Os testes da API usam um banco em memória: não mexem nos seus dados.

## Convenções

- **Português no código e na interface.** Nomes de variáveis, funções, tabelas e mensagens em português, para o código falar a mesma língua da tela.
- **Regras em `dominio.ts`.** Tudo o que a interface e o servidor precisam concordar (prazo, ordem, arquivamento) mora ali, em funções puras e testadas.
- **Banco só pelo `Repositorio`.** Nenhuma rota escreve SQL direto.
- **Migrações só se acrescentam.** Para mudar o banco, adicione uma migração ao fim da lista em `db.ts`. Nunca edite uma que já existe.
- **Toda entrada é validada** com Zod na rota.
- **Comentário explica o porquê**, em uma linha, quando o código não mostra sozinho.
- **Visual pelo [DESIGN.md](../DESIGN.md).** Cores novas entram como token em `:root`, com o par claro e escuro.
- **Commits** no padrão Conventional Commits, em português: `feat(historico): …`, `fix(interface): …`.
