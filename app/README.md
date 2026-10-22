# DONELY · app

Quadro pessoal de tarefas que roda na sua máquina. Você cria as tarefas, move entre as colunas (A fazer, Fazendo, Aguardando retorno, Concluído) e, depois de alguns dias em Concluído, elas vão sozinhas para **Tarefas feitas**.

Não precisa de conta em serviço nenhum. Os dados ficam num arquivo na sua máquina.

## Como usar

Precisa do **Node 22.13 ou mais novo** (`node --version`).

```bash
cd app
npm install
npm start
```

Abra **http://localhost:3333**. Para parar, aperte `Ctrl+C` no terminal.

Ao iniciar, o Node mostra um aviso de que o SQLite embutido é experimental. É esperado e não afeta o uso.

## Seus dados

- Ficam em `app/dados/donely.db`. Para fazer backup, copie a pasta `app/dados/` com o servidor parado.
- Para usar outro arquivo, defina `DONELY_DB` (veja `.env.example`).
- O servidor só aceita conexões desta máquina e recusa pedidos vindos de outros sites abertos no navegador.

## Para desenvolver

```bash
npm run dev        # servidor em :3333 e interface com recarga automática em http://localhost:5173
npm test           # testes (regras do domínio e API)
npm run typecheck  # checagem de tipos
```

Estrutura:

```
src/shared/dominio.ts        tipos e regras (prazo, ordem do quadro, arquivamento), usados nos dois lados
src/server/db.ts             banco SQLite e migrações (para mudar o banco, adicione uma migração nova)
src/server/repositorio.ts    leitura e escrita no banco
src/server/api.ts            rotas /api, validadas com Zod
src/server/integracoes/      contrato dos conectores (o primeiro será o Notion)
src/client/                  interface React
```

As cores vêm de `../brand/tokens/cores.css`. Se mudar a paleta, rode `npm run paleta` na raiz do repositório.

## Usando no WSL

Se `localhost:3333` não abrir no navegador do Windows, confira se o encaminhamento de localhost do WSL está ligado (`localhostForwarding=true` no arquivo `.wslconfig`) ou abra o navegador dentro do próprio WSL.

## Próximos passos

- **Integração com o Notion:** puxar os cards atribuídos a você. A forma está definida em `src/server/integracoes/tipos.ts` e em `../plan/docs/decisoes/001-app-local.md`.
