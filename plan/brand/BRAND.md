# DONELY: especificação da marca

Versão 2 · 21/10/2026 · substitui a versão Donko (arquivada em `legado-donko/`)

## Conceito

**DONELY** vem de "done" (feito) com o sufixo "ly", que dá a ideia de algo leve e fácil. A ação que o produto resolve é concluir tarefas. O símbolo é a prancheta do Donko, com um check dentro da folha: tarefa concluída. A prancheta com clip mantém a origem do produto, e o check torna a ação visível.

## Arquivos

| Arquivo | Uso |
|---|---|
| `donely-principal.svg` | Logo empilhado (símbolo em cima, nome embaixo). Uso padrão |
| `donely-horizontal.svg` | Logo na horizontal (símbolo à esquerda). Cabeçalhos e barras |
| `donely-icone.svg` | Só o símbolo. Favicon, ícone de app, avatar |
| `donely-monocromatico.svg` | Uma cor só, preto no branco. Impressão e carimbo |
| `donely-branco.svg` | Versão branca, para fundo escuro ou foto |
| `donely-icone-monocromatico.svg` | Símbolo de uma cor só |
| `donely-construcao.svg` | Grade e medidas do símbolo, para quem for reproduzir |
| `png/` | Tamanhos para web, app e favicon (ver abaixo) |

Prefira SVG. Use PNG só quando o programa não aceitar vetor.

PNG disponíveis: `donely-principal` (1024, 512), `donely-horizontal` (1024), `donely-monocromatico` (1024), `donely-branco` (1024), `donely-icone` (512, 192, 180, 64, 32, 16), `donely-icone-monocromatico` (não exportado; gere com `npm run marca` se precisar).

## Cores

| Nome | HEX | Onde |
|---|---|---|
| Verde-tinta | `#173527` | Prancheta, furo do clip, nome |
| Lima | `#8BD15A` | Clip |
| Verde do check | `#2F9E5B` | Check |
| Papel | `#F5F8EE` | Folha da prancheta |

Cores de apoio para a aplicação (não fazem parte do logo): branco `#FFFFFF`, e o verde-tinta em 12% para linhas de grade.

## Escalas de cor

Cada cor da marca tem 5 tons, calculados em OKLCH para que os saltos de luminosidade pareçam iguais. Em negrito, a cor original da marca. Visual em `donely-paleta.svg`.

| Cor | 100 | 300 | 500 | 700 | 900 |
|---|---|---|---|---|---|
| Verde-tinta | `#ECF6F1` | `#B2C2B9` | `#7B9085` | `#486154` | **`#173527`** |
| Verde do check | `#DFFCE6` | `#8ECD9F` | **`#2F9E5B`** | `#086A36` | `#003819` |
| Lima | `#E6FCDA` | **`#8BD15A`** | `#609B34` | `#386708` | `#193700` |
| Papel | **`#F5F8EE`** | `#BEC1B8` | `#8A8C85` | `#595B55` | `#2D2E2A` |

Os tokens prontos para usar ficam em `tokens/cores.css` (variáveis CSS como `--check-700`) e `tokens/cores.json`. Gere de novo com `npm run paleta`.

**Papéis de uso (já definidos em `cores.css`):**

| Token | Valor | Para quê |
|---|---|---|
| `--cor-fundo` | papel 100 | Fundo da aplicação |
| `--cor-superficie` | branco | Cards e painéis |
| `--cor-borda` | papel 300 | Bordas e divisórias |
| `--cor-texto` | tinta 900 | Texto principal |
| `--cor-texto-apagado` | papel 700 | Texto secundário |
| `--cor-acao` | check 700 | Botões e links |
| `--cor-sucesso` | check 500 | Ícones e estados de concluído |
| `--cor-destaque` | lima 300 | Destaques e marcações |

**Contraste:** para texto sobre branco ou papel, use só os tons **700 e 900** (contraste acima de 6,5). Os tons 500 passam só em textos grandes (24 px ou mais) e ícones. Os tons 100 e 300 são para fundos. Por isso o verde do check original (500) não é usado em botões com texto branco: lá entra o check 700.

## Tipografia

O nome "DONELY" é um caminho vetorial, não texto. Não depende de fonte instalada. A fonte de origem é a **Outfit ExtraBold (800)**, licença SIL Open Font License 1.1, com espaçamento entre letras de 3%.

Para textos do site e do app, use a mesma família (Outfit). Para títulos, use peso 700 ou 800.

## Área de proteção

Deixe em volta do logo uma margem igual a **10% da largura** (ícone: 10% da altura). Nada entra nessa área.

## Tamanho mínimo

| Versão | Digital | Impresso |
|---|---|---|
| Logo principal | 120 px de largura | 30 mm |
| Logo horizontal | 160 px de largura | 40 mm |
| Ícone | 16 px | 8 mm |

Abaixo de 32 px, use só o ícone. O nome fica ilegível nesse tamanho.

## Construção

O símbolo é feito numa grade de 400 × 400 unidades (ver `donely-construcao.svg`):
- prancheta: 240 × 290, cantos de raio 34, centrada no eixo x = 200;
- folha: 192 × 226, inset de 24 unidades, cantos de raio 16;
- clip: 100 × 62, sobre a borda superior da prancheta, cantos de raio 20;
- furo do clip: 48 × 16;
- check: três pontos (148,226), (184,262), (254,190), traço de 26 unidades com pontas arredondadas.

## Fundos

- **Claro (padrão):** logo principal em cores.
- **Escuro:** use `donely-branco.svg`. Não use a versão colorida sobre o verde-tinta.
- **Foto ou padrão:** coloque o logo sobre uma faixa sólida.
- **Uma cor só:** monocromático.

## Não fazer

- Esticar, comprimir ou girar.
- Trocar as cores ou criar outro gradiente.
- Recriar o nome com outra fonte.
- Mudar o check para outro símbolo (ex.: X ou seta). O check é a ideia da marca.
- Adicionar sombra, brilho ou contorno extra.

## Como regerar

```bash
npm install
npm run marca
```

Para trocar o nome, altere `NOME` em `scripts/marca.js`. A caixa do texto escala sozinha pela largura, então nomes de outro tamanho mantêm o mesmo peso visual.

Origem do símbolo: a prancheta do projeto [Donko](https://github.com/HigorLoren/donko) (licença MIT, Higor Lorenzon), redesenhada.
