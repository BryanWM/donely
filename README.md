# DONELY

Quadro pessoal de tarefas que roda na sua máquina. Você organiza o trabalho em pastas (A fazer, Fazendo, Concluído), registra os pedidos que chegam fora do plano e guarda tudo o que foi feito num Histórico pronto para virar relatório.

Não precisa de conta em serviço nenhum. Os dados ficam num arquivo na sua máquina, e o servidor só aceita conexões dela mesma.

## O que ele faz

- **Fluxo em pastas.** Toda tarefa começa em A fazer e anda pelo fluxo com um botão por etapa: Iniciar, Concluir e Arquivar. Não há arrastar nem mover à mão, para o quadro refletir o que de fato aconteceu.
- **Dois modelos de card.** O **Projeto** tem briefing, referências, checklist e o material produzido, nessa ordem. O **Rápido** tem só título, descrição, tipo, prazo, prioridade e checklist, para as tarefas do dia a dia.
- **Caderno** (tecla `N`). Anotações por pessoa e rascunhos de ideias, em Markdown, com salvamento automático.
- **Não planejadas.** A Captura rápida (tecla `C`) registra em segundos um pedido que chegou no meio do dia, e um cronômetro mede o tempo gasto nele.
- **Histórico.** O que foi concluído vai sozinho para o Histórico depois de alguns dias, com relatório por semana, mês ou período, para copiar ou imprimir em PDF.
- **Comemoração.** Cada tarefa concluída ganha uma animação da logo.

## Como usar

Precisa do **Node 22.13 ou mais novo** (`node --version`).

```bash
cd app
npm install
npm start
```

Abra **http://localhost:3333**. Para parar, aperte `Ctrl+C` no terminal.

O Node avisa ao iniciar que o SQLite embutido é experimental. É esperado e não afeta o uso.

**Atalho na área de trabalho (Windows com WSL):** com o app aberto, vá em **Configurações › Atalho na área de trabalho › Criar atalho** (ou rode `bash scripts/criar-atalho.sh`). O atalho DONELY, com o ícone da marca, sobe o app e abre o navegador. Aberto por ele, o app ganha o botão **Desligar** no topo. Detalhes no [guia de uso](docs/uso.md#atalho-na-área-de-trabalho).

## Seus dados e backup

Tudo fica na sua máquina, na pasta `app/dados/`, sem nuvem e sem conta. Faça backup copiando essa pasta inteira, com o DONELY desligado, para um lugar seguro. O passo a passo, pelo Windows ou pelo terminal, e como restaurar estão no [guia de uso](docs/uso.md#backup).

## Documentação

| Documento | Para quê |
|---|---|
| [Guia de uso](docs/uso.md) | As pastas, o card, a Captura rápida, o Histórico, as configurações, o atalho e o backup |
| [Arquitetura](docs/arquitetura.md) | Como o app é montado: servidor, banco, interface e segurança |
| [API](docs/api.md) | As rotas do servidor local |
| [Desenvolvimento](docs/desenvolvimento.md) | Rodar em modo de desenvolvimento, testes e convenções |
| [Sistema de design](DESIGN.md) | Cores, tipografia, componentes e regras visuais |
| [Por que um app local](docs/arquitetura.md#por-que-um-app-local) | A escolha de Node, SQLite e nenhuma nuvem |

## Estrutura do repositório

```
app/                  o quadro (Node + Hono + React + SQLite)
brand/                logos, ícones, tokens de cor (brand/tokens/cores.css), especificação (BRAND.md) e o logo do Donko
docs/                 documentação do projeto
scripts/              atalho da área de trabalho (iniciar.sh, criar-atalho.sh) e geradores da marca e da paleta
DESIGN.md             sistema de design
```

## Marca

A marca DONELY nasceu de um retrabalho do logo do Donko. Logos, ícones e especificação estão em `brand/` (veja `brand/BRAND.md`); o logo original do Donko fica em `brand/legado-donko/`. Para gerar SVG e PNG de novo, na raiz:

```bash
npm install
npm run marca
```

## Créditos

O DONELY começou como um fork do **[Donko](https://github.com/HigorLoren/donko)**, o kanban open source criado por **Higor Lorenzon** ([@HigorLoren](https://github.com/HigorLoren)). O app foi reescrito do zero, mas a ideia, a referência de interface e o logo que deu origem à marca DONELY vêm do Donko. Obrigado, Higor.

O Donko é distribuído sob a licença MIT:

> MIT License · Copyright (c) 2019 Higor Lorenzon
