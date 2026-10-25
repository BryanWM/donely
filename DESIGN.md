---
name: DONELY
description: Quadro pessoal de tarefas que roda na sua máquina, com a linguagem visual do iOS adaptada ao desktop.
colors:
  tinta: "#173527"
  check: "#2F9E5B"
  check-escuro: "#086A36"
  lima: "#8BD15A"
  papel: "#F5F8EE"
  fundo-salvia: "oklch(0.915 0.022 150)"
  superficie: "oklch(0.975 0.008 140)"
  cartao-tarefa: "oklch(0.995 0.004 140)"
  pasta-fechada: "oklch(0.87 0.026 150)"
  texto-secundario: "oklch(0.45 0.025 162)"
  texto-terciario: "oklch(0.495 0.02 162)"
  separador: "oklch(0.301 0.045 162 / 0.1)"
  preenchimento: "oklch(0.301 0.045 162 / 0.05)"
  preenchimento-forte: "oklch(0.301 0.045 162 / 0.08)"
  acao-suave: "oklch(0.95 0.04 152)"
  erro: "oklch(0.52 0.19 27)"
  erro-fundo: "oklch(0.95 0.022 27)"
  atencao: "oklch(0.5 0.105 75)"
  atencao-fundo: "oklch(0.955 0.035 75)"
  ponto-fazendo: "oklch(0.7 0.16 134)"
typography:
  titulo-card:
    fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  titulo-pagina:
    fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "17px"
    fontWeight: 700
  titulo-linha:
    fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 600
  corpo:
    fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "14.5px"
    fontWeight: 400
    lineHeight: 1.55
  rotulo:
    fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 500
  numero:
    fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 800
    fontFeature: "tnum"
rounded:
  xs: "6px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  aba: "14px"
  painel: "20px"
  pilula: "999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
components:
  botao-principal:
    backgroundColor: "{colors.check-escuro}"
    textColor: "{colors.papel}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 14px"
  botao-padrao:
    backgroundColor: "{colors.preenchimento}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 14px"
  botao-padrao-hover:
    backgroundColor: "{colors.preenchimento-forte}"
  botao-acao-linha:
    textColor: "{colors.check-escuro}"
    rounded: "{rounded.sm}"
    height: "30px"
    padding: "0 10px"
  campo:
    backgroundColor: "{colors.preenchimento}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "7px 11px"
  campo-hover:
    backgroundColor: "{colors.preenchimento-forte}"
  linha-tarefa:
    backgroundColor: "{colors.cartao-tarefa}"
    rounded: "{rounded.lg}"
    padding: "6px 12px 6px 16px"
  aba-fechada:
    backgroundColor: "{colors.pasta-fechada}"
    textColor: "{colors.texto-secundario}"
    rounded: "{rounded.aba}"
    height: "42px"
  aba-aberta:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    height: "46px"
  selo-atencao:
    backgroundColor: "{colors.atencao-fundo}"
    textColor: "{colors.atencao}"
    rounded: "{rounded.pilula}"
    height: "22px"
  selo-erro:
    backgroundColor: "{colors.erro-fundo}"
    textColor: "{colors.erro}"
    rounded: "{rounded.pilula}"
    height: "22px"
---

# Sistema de design: DONELY

> Os títulos das seções trazem o termo padrão do formato DESIGN.md entre parênteses, para que ferramentas de design reconheçam cada parte. Os valores do bloco no topo são a fonte da verdade; o texto explica onde e por que usar cada um. Fonte no código: `app/src/client/estilos.css` e `brand/tokens/cores.css`.

## Visão geral (Overview)

**Estrela-guia: "A Prancheta de Campo"**

O DONELY é a caderneta da logo levada para o dia de trabalho: uma prancheta verde-tinta com papel sálvia por cima, e as etapas do trabalho guardadas como pastas suspensas. É uma ferramenta de mão. Abre-se para resolver a próxima tarefa, não para ser admirada, e por isso o visual é calmo: pouco contraste entre as áreas da tela, contraste alto só no texto, e cor apenas onde há ação ou estado.

A linguagem vem do iOS (listas agrupadas, janelas em forma de folha, controles segmentados), adaptada ao desktop de 1366×768 a 1920×1080. A densidade é de ferramenta: uma linha por tarefa, colunas alinhadas, e o cabeçalho numa faixa só, para que a lista comece alto na tela. O movimento é curto e explica o que mudou (a aba que sobe, a linha que viaja até a pasta de destino). O único momento expansivo é a comemoração ao concluir uma tarefa.

Há dois temas compostos à parte, claro e escuro, com o mesmo matiz. O escuro não é o claro invertido: as superfícies sobem em degraus de luminosidade no verde-tinta.

**Características principais:**
- Um tom só para a página (sálvia claro ou verde-tinta profundo), com o painel e as linhas um degrau acima.
- Verde do check reservado para ação, seleção e sucesso. Âmbar e vermelho só para prazo e erro.
- Abas em forma de pasta suspensa, fundidas ao painel quando abertas.
- Camadas translúcidas da tinta (5%, 8%, 10%) no lugar de cinzas, para funcionar sobre qualquer fundo.
- Uma família tipográfica (Outfit) em pesos de 400 a 800.

## Cores (Colors)

Uma paleta de verdes da marca em OKLCH, com o matiz fixo por rampa: neutros no matiz da tinta (162), ação no verde do check (152), e só os estados que a tela usa, erro (27) e atenção (75). Cada cor tem um par claro e escuro com `light-dark()`; os valores do topo são os do tema claro.

### Primária (Primary)
- **Verde do Check, escuro** (check-escuro): a cor de ação. Botão principal, links, contorno das ações da linha sob o mouse, anel de foco, aba com tarefa chegando. No tema escuro vira um verde claro luminoso (`oklch(0.76 0.13 152)`).
- **Verde do Check** (check): sucesso. Caixa de seleção marcada, ponto da coluna Concluído, barra de progresso do checklist, o check da logo na comemoração.

### Secundária (Secondary)
- **Lima** (lima): o destaque da marca. Aparece na prancheta da logo e nas partículas da comemoração. Não é usado em controles.

### Terciária (Tertiary)
- **Âmbar de Atenção** (atencao / atencao-fundo): "Vence hoje", prioridade Alta, avisos de configuração que faltam.
- **Vermelho de Erro** (erro / erro-fundo): "Atrasada", prioridade Urgente, mensagens de erro e ações destrutivas confirmadas.

### Neutra (Neutral)
- **Verde-Tinta** (tinta): o texto principal no tema claro e o fundo do aviso flutuante. É o verde quase preto da marca.
- **Sálvia de Fundo** (fundo-salvia): a página inteira, sem faixas e sem branco puro.
- **Papel do Painel** (superficie): o painel principal e as janelas, um degrau acima do fundo. Nunca `#fff`.
- **Papel da Linha** (cartao-tarefa): cada linha de tarefa, um degrau acima do painel.
- **Pasta Fechada** (pasta-fechada): abas não selecionadas, um degrau abaixo do fundo.
- **Tinta Secundária e Terciária** (texto-secundario, texto-terciario): metadados, rótulos, textos de apoio. Ambas medidas em 4,5:1 ou mais sobre o fundo e sobre as camadas.
- **Camadas da Tinta** (preenchimento 5%, preenchimento-forte 8%, separador 10%): fundo de campos e botões, hover, linhas divisórias. São translúcidas de propósito.

### Regras

**A Regra do Verde que Age.** O verde do check marca o que se pode fazer ou o que deu certo. Não serve de enfeite, fundo de seção ou decoração.

**A Regra do Degrau.** Áreas se separam por um degrau de luminosidade (fundo, painel, linha), não por bordas. Uma linha divisória de 1px na camada de 10% é o máximo.

**A Regra do Par Composto.** Toda cor nova entra com o par claro e escuro em `light-dark()`, medido nos dois temas: texto 4,5:1, ícones e anel de foco 3:1.

## Tipografia (Typography)

**Fonte de títulos e corpo:** Outfit (com -apple-system, BlinkMacSystemFont, Segoe UI e sans-serif de reserva), servida localmente pelo `@fontsource`, nos pesos 400, 500, 600, 700 e 800.

**Caráter:** uma geométrica amigável e arredondada, que conversa com as formas da logo. Faz todo o trabalho sozinha: a hierarquia vem de peso e tamanho, não de uma segunda família.

### Hierarquia
- **Título do card** (700, 24px, altura 1,25, -0,015em): o nome da tarefa na janela do card.
- **Título da página** (700, 17px): "Minhas tarefas" no cabeçalho.
- **Título da linha** (600, 15px): o nome da tarefa na lista, cortado com reticências e com o nome inteiro na dica.
- **Corpo** (400, 14,5px, altura 1,55): células da lista, briefing, textos de lista.
- **Rótulo** (500, 13px): cabeçalho das colunas, nomes de grupo, botões pequenos.
- **Número** (800, 16px, algarismos tabulares): os indicadores do topo. Contagens, datas e tempos em toda a interface também usam algarismos tabulares, para alinhar em coluna.

### Regras

**A Regra da Família Única.** Só Outfit. Uma segunda família só entra com um papel que a Outfit não consiga cumprir.

**A Regra do Número Alinhado.** Todo número que aparece em coluna ou muda de valor usa `font-variant-numeric: tabular-nums`.

## Layout (Layout)

Pensado para desktop, de 1366×768 a 1920×1080. A tela tem três faixas: o cabeçalho numa linha só (marca, título e data, indicadores, ações), a fileira de abas e o painel, que ocupa o resto da altura e rola por dentro.

A lista de tarefas é uma grade de sete colunas compartilhada pelo cabeçalho e pelas linhas: tarefa (a mais larga), cliente, tipo, prioridade, prazo, itens e ações (132px fixos). Uma variável CSS guarda as colunas na lista para que cabeçalho e linhas nunca desalinhem.

O ritmo de espaçamento usa a escala do topo: 6px entre linhas da lista, 8 a 12px dentro de grupos, 16 a 24px entre grupos e nas margens do painel. Janelas largas (Nova tarefa, card) usam duas colunas: o conteúdo principal à esquerda e as propriedades à direita.

## Elevação e profundidade (Elevation & Depth)

O sistema é tonal com sombras discretas. A profundidade vem principalmente dos degraus de luminosidade (fundo, painel, linha). As sombras são suaves, sempre com deslocamento e desfoque, e tingidas na tinta da marca (no escuro, preto).

### Vocabulário de sombras
- **Sombra do cartão** (`0 1px 2px` e `0 1px 1px` na camada suave): linhas da lista, logo do cabeçalho, botões de destaque. Só para tirar do papel, sem flutuar.
- **Sombra do painel** (`0 1px 2px` suave + `0 12px 32px -20px` forte): o painel principal.
- **Sombra flutuante** (`0 24px 60px -20px` forte + `0 8px 20px -12px` suave): janelas, aviso flutuante e a linha em voo.

### Regras

**A Regra do Véu.** Uma janela aberta embaça o resto da tela (véu da tinta a 35% no claro, preto a 55% no escuro, com desfoque de 4px). O desfoque existe só para isso: separar a janela do que ficou atrás.

## Formas (Shapes)

Cantos suaves e consistentes, sem extremos. Campos e botões padrão em 10px, botões pequenos em 8px, linhas da lista e listas agrupadas em 12px, o painel principal em 20px nos cantos de baixo. Os cantos de cima do painel são retos, porque as abas das pontas sempre pousam sobre eles.

A forma assinatura é a **aba de pasta suspensa**: canto superior arredondado de 14px de um lado e, do outro, uma inclinação curva até a base. As abas da direita são espelhadas, com a inclinação do lado de dentro. Pílulas (999px) ficam para selos, contagens e sugestões.

## Componentes (Components)

### Botões
- **Forma:** cantos suaves (10px; pequenos, 8px), altura 36px (pequenos, 30px).
- **Principal:** fundo verde do check escuro e texto papel, peso 600. Um por tela: "Nova tarefa", "Criar tarefa", "Copiar relatório".
- **Padrão:** fundo na camada de 5%, hover na de 8%, e encolhe para 96% ao pressionar.
- **Contorno:** fundo transparente com contorno de 1px na cor de ação. É o estilo das ações da linha.
- **Texto:** só a cor de ação, para ações de cabeçalho de janela ("Fechar", "Salvar", "Cancelar").
- **Perigo:** vermelho de erro. Ações destrutivas pedem um segundo clique ("Confirmar limpeza", "Clique de novo para confirmar a exclusão").

### Ações da linha
Um só padrão em todas as abas: Iniciar, Concluir e Arquivar. Têm a largura da coluna, ícone de 13px e texto curto. Em repouso ficam neutras (texto secundário, contorno na tinta a 45%); a linha sob o mouse ou com foco as pinta de verde. Enquanto a ação roda, o botão fica desativado.

### Selos e chips
- **Selos** (pílula, 22px): "Atrasada · 2 dias" em vermelho e "Vence hoje" em âmbar. Data futura não vira selo: é texto simples.
- **Chips** (6px, camada de 5%): o tipo de entrega na lista e os tipos editáveis nas configurações.

### Linhas de tarefa
- **Fundo:** papel da linha, um degrau acima do painel.
- **Cantos:** 12px, com sombra do cartão.
- **Faixa à esquerda:** 3px na cor do que pede atenção (atraso vale mais que prioridade); some nas concluídas, que ficam com o título riscado.
- **Clique:** a linha inteira abre o card; só a célula de ações tem clique próprio.

### Campos
- **Estilo:** sem borda, fundo na camada de 5%, cantos de 10px.
- **Hover:** fundo na camada de 8% e contorno verde fino (cor de ação a 35%). Vale para todo campo de texto, data e seleção, inclusive os transparentes. Campos só de leitura e desativados não reagem.
- **Foco:** anel de 2px na cor de ação. Dentro de listas agrupadas (que cortam o que passa da borda), o anel fica por dentro e o campo usa o raio do container.
- **Campos transparentes** (título do card, valores à direita nas listas): têm folga interna fixa compensada por margem negativa, para o texto ficar no lugar e o contorno não encostar nele.

### Navegação (abas de pasta)
- **Fechada:** pasta-fechada, texto secundário, 42px de altura.
- **Hover:** sobe para 44px, como quem espia a pasta.
- **Aberta:** cor do painel, texto principal, 46px, fundida ao painel. A troca anima a altura (260ms) e o conteúdo entra subindo 8px.
- **Contagem:** número tabular ao lado do nome. Quando muda, dá um pulso verde.
- **Teclado:** setas, Home e End trocam de aba. A aba focada não ganha anel: o nome fica sublinhado.

### Listas agrupadas (padrão iOS)
Container de 12px no papel do painel, com linhas de 46px separadas por uma linha de 1px que começa a 16px da borda. Rótulo à esquerda, valor ou controle à direita. É a base das configurações, das propriedades do card e dos formulários.

### Janelas (folha)
Cabeçalho em três partes: ação à esquerda, título ao centro, ação à direita ("Fechar" por padrão). Fecham com Esc, no botão ou clicando fora. O card abre com o foco em "Fechar"; os formulários abrem com o foco no primeiro campo.

### Comemoração
Ao concluir uma tarefa, a tela embaça e a logo se monta em 5,6s: a prancheta surge, um lápis escreve seis linhas, elas convergem para o check com partículas em lima e verde, e "DONELY" se forma letra por letra. Fecha com um clique. Com "reduzir movimento" ligado, não aparece.

## Faça e não faça (Do's and Don'ts)

### Faça:
- **Faça** a separação de áreas por degraus de luminosidade (fundo, painel, linha), não por bordas.
- **Faça** a cor de ação aparecer só no que se pode clicar ou no que deu certo.
- **Faça** toda cor nova com o par claro e escuro e o contraste medido nos dois temas (texto 4,5:1, ícones e foco 3:1).
- **Faça** as ações repetidas por linha ficarem neutras em repouso e verdes só na linha sob o mouse.
- **Faça** o movimento curto (150 a 300ms) e com motivo: mostrar para onde algo foi ou o que mudou. Todo movimento respeita "reduzir movimento".
- **Faça** textos longos cortarem com reticências e mostrarem o conteúdo inteiro na dica.

### Não faça:
- **Não use** branco puro (`#fff`) nem preto puro em superfícies; use os papéis e a tinta.
- **Não use** cinza neutro para texto secundário; use a tinta secundária e terciária, que levam o matiz da marca.
- **Não ponha** uma coluna inteira de botões coloridos; repetição em verde pesa e apaga a ação que importa.
- **Não use** uma segunda família tipográfica nem fontes do sistema como voz de título.
- **Não use** o lima em controles; ele é da marca, não da interface.
- **Não reinvente** controles padrão (seletores, datas, caixas de seleção) além do acabamento das cores.
