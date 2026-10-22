# DONELY

Fork do [Donko](https://github.com/HigorLoren/donko), um kanban open source. É a base da marca DONELY e é usado como referência de interface para dois protótipos internos da WRMax. O repositório original fica intocado em `../donko`.

## App

O quadro pessoal em desenvolvimento fica em `app/` e roda na sua máquina, sem contas em serviços:

```bash
cd app && npm install && npm start
```

Detalhes em `app/README.md`. A decisão de stack está em `plan/docs/decisoes/001-app-local.md`.

## Protótipos

| Pasta | O que é | Publicado (privado) |
|---|---|---|
| `plan/prototipos/demandas-equipe` | Kanban da equipe: gestor, funcionários e freelancers | https://claude.ai/artifact/N5Wy8ny3kbxa5hg9upgWt3 |
| `plan/prototipos/quadro-pessoal` | Quadro de uma pessoa só, com Tarefas feitas | https://claude.ai/artifact/8RvKFGkPTKQWirfTc9ygpT |

Os protótipos são HTML puro, sem backend. Os dados de exemplo são fictícios e ficam salvos só no navegador (ou na conta do claude.ai, no caso do quadro pessoal).

## Marca

Marca **DONELY** (rework do logo Donko): logo, ícone, versões e especificação estão em `brand/` (ver `brand/BRAND.md`). A versão anterior fica em `brand/legado-donko/`. Para gerar SVG e PNG de novo:

```bash
npm install
npm run marca
```

## Como gerar as páginas

```bash
python3 scripts/build.py
```

Dentro de `plan/`: `python3 plan/scripts/build.py` gera `plan/dist/*.html` com o logo embutido. Cada `src.html` usa o marcador `__LOGO__` no lugar do logo, que vem de `plan/assets/wrmax-logo.png`.

## Estrutura

Desenvolvimento (raiz):

```
app/                  quadro pessoal (Node + Hono + React + SQLite)
brand/                logos em uso, ícones do app e tokens de cor (brand/tokens/cores.css)
scripts/              geradores de marca (npm run marca) e paleta (npm run paleta)
```

Planejamento (`plan/`), separado do que é código:

```
plan/docs/            plano da versão de equipe e decisões de arquitetura
plan/brand/           especificação da marca, paleta e folha de construção, além da marca Donko (legado-donko/)
plan/prototipos/      protótipos em HTML da versão de equipe e do quadro pessoal
plan/dist/            HTML gerado dos protótipos
plan/scripts/         gerador dos protótipos e gerador da marca Donko
plan/assets/          logo WRMax usado nos protótipos
```

## Próximo passo

Integração com o Notion no app (puxar os cards atribuídos à pessoa).
