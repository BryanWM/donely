# Guia de uso

Como o DONELY funciona no dia a dia. Para instalar, veja o [README](../README.md).

## A tela

No topo ficam o título com a data de hoje, um resumo (abertas, atrasadas, vencem hoje e feitas na semana) e os atalhos: **Captura rápida** (`C`), **Caderno** (`N`) e **Configurações**. Quando o DONELY foi aberto pelo atalho da área de trabalho, aparece também o botão **Desligar** (veja [Atalho na área de trabalho](#atalho-na-área-de-trabalho)).

Abaixo ficam as abas, em forma de pasta:

| Aba | O que guarda |
|---|---|
| **A fazer** | Tarefas que ainda não começaram. Toda tarefa nova entra aqui. |
| **Fazendo** | O que está em andamento. Iniciou por engano? O card tem **Voltar para A fazer**. |
| **Concluído** | O que terminou. Fica aqui alguns dias e depois vai para o Histórico. |
| **Não planejadas** | Pedidos que chegaram fora do plano (veja [Captura rápida](#captura-rápida)). |
| **Histórico** | Tudo o que foi concluído, com relatório por período. |

As setas do teclado, `Home` e `End` trocam de aba.

## O fluxo de uma tarefa

A tarefa só muda de pasta pelo botão da linha. Não há arrastar nem mover à mão: assim o quadro mostra o que de fato aconteceu.

1. **Iniciar** leva de A fazer para Fazendo.
2. **Concluir** leva de Fazendo para Concluído.
3. Em Concluído, **Arquivar** manda para o Histórico na hora. Sem clicar, ela vai depois do prazo escolhido nas configurações.

Ao clicar numa ação, a linha "viaja" até a aba de destino e o contador dela pulsa. Cada tarefa concluída ganha uma comemoração com a logo, que fecha com um clique. Quem tem "reduzir movimento" ligado no sistema não vê as animações.

## Dois modelos de card

Ao clicar em **Novo card**, você escolhe entre:

- **Projeto:** o formulário completo, com cliente, tipo de entrega, briefing, referências, checklist e material produzido.
- **Rápido:** só o essencial, para tarefas comuns. Tem título (obrigatório), descrição, tipo (opcional), prazo, prioridade e checklist. Não tem cliente, briefing nem arquivos.

Os cards que já existiam continuam sendo Projeto.

## A lista

Cada linha mostra tarefa, cliente, tipo, prioridade, prazo, itens do checklist e a ação da etapa. Clique na linha para abrir o card. Um card Rápido mostra a descrição logo abaixo do título, e só aparecem os campos que foram preenchidos.

- **Ordem:** atrasadas primeiro, depois por prioridade (Urgente, Alta, Normal) e por prazo. Em Concluído, as mais recentes no topo.
- **Faixa colorida à esquerda:** vermelha para atrasada ou urgente, âmbar para alta.
- **Selos de prazo:** "Atrasada · N dias" e "Vence hoje". Data futura aparece como texto.
- **Coluna Cliente:** aparece quando a lista tem algum Projeto. Se só houver cards Rápidos, ela some e a tabela fica mais estreita.
- **Filtros:** busca por título, cliente ou nota, e filtros por cliente, tipo e modelo (Todos, Projetos ou Rápidos).
- **Excluir na linha:** a lixeira em cada card exclui na hora, sem abrir o modal. O primeiro clique deixa o botão vermelho, e o segundo exclui. Se o foco sair antes, volta ao normal.
- **Novo card:** botão verde à direita dos filtros. Se a janela estiver estreita, o botão continua na primeira linha e os filtros descem para a segunda.

## O card

O card segue a ordem do trabalho:

1. **Briefing:** o que precisa ser feito. Editável até a tarefa ser concluída.
2. **Referências:** imagens, PDFs e documentos que orientam o trabalho. Arraste, cole (`Ctrl+V`) ou clique para adicionar.
3. **Checklist:** itens com barra de progresso. Digite e aperte `Enter` para adicionar.
4. **Material produzido:** os arquivos do resultado.

Na coluna da direita ficam cliente, tipo, prioridade, prazo, o histórico de eventos e o botão de excluir, que pede um segundo clique.

O card é editável em A fazer e em Fazendo. Em Concluído ele mostra os dados sem deixar mudar.

## O card Rápido

Abre com só cinco campos: **Título**, **Descrição**, **Tipo**, **Prazo** e **Prioridade**, mais o **Checklist**.

- **Prioridade:** "Sem prioridade" é o padrão, e nesse caso o card não mostra nada. Alta e Urgente aparecem no card.
- **Checklist:** adicione itens com `Enter`, edite o texto clicando no item, marque e desmarque, e remova com o `×`.
- **Ações:** no rodapé do detalhe, **Iniciar**, **Concluir** ou **Voltar para A fazer**, conforme a etapa. A exclusão é pela lixeira da lista.
- Em Concluído, o card fica só de leitura, como no Projeto.

## Caderno

Para anotações que não são de uma tarefa. Aperte `N` ou clique em **Caderno**. Ele tem duas áreas, escolhidas no topo:

- **Pessoas:** uma lista de pessoas com quem você conversa. Para cada uma, anote o que foi conversado, com data e hora. As anotações podem ser escritas em Markdown, com as abas **Escrever** e **Visualizar**. Enquanto você escreve, o texto é salvo sozinho.
- **Ideias:** rascunhos livres. Cada rascunho pode ser renomeado e ligado a um cliente ou a uma tarefa. Para aproveitar um rascunho, escolha o destino: **Nova tarefa** (cria um Projeto com o texto no briefing) ou **Tarefa existente** (o texto entra no fim do briefing dela). O rascunho em si não muda.

## Captura rápida

Para o pedido que chega no meio do dia ("troca a foto do post de sexta"). Aperte `C` em qualquer lugar da tela, ou clique em **Captura rápida**:

1. Escreva o que pediram.
2. Escolha quem pediu (Gestor, Colega, Cliente, Ligação, E-mail, WhatsApp ou outro nome).
3. Marque Urgente se for o caso e aperte `Enter`.

O pedido entra em **Não planejadas** com data e hora. Lá você inicia o cronômetro, pausa e conclui. Só uma demanda roda por vez: iniciar outra pausa a atual. Enquanto uma demanda roda, o cronômetro aparece no topo, em qualquer aba.

## Histórico

Reúne tarefas e demandas concluídas. O período e os números ficam num painel à esquerda; a lista, agrupada por dia, ocupa o resto da tela, com a busca, o filtro e as ações logo acima dela.

- **Período:** semana, mês ou um intervalo de datas, com setas para navegar. Na semana, cada dia mostra quantos itens teve; clique num dia para ir até ele na lista.
- **Números do período:** tarefas concluídas, não planejadas e o tempo gasto fora do plano.
- **Mostrar:** tudo, tarefas ou não planejadas, com a contagem de cada um, ao lado da busca.
- **Copiar relatório:** copia o período em texto, pronto para colar numa mensagem.
- **PDF:** o nome sugerido do arquivo já traz o período, por exemplo "Relatório de atividades DONELY 01-10-2026 a 31-10-2026". Abre a impressão do navegador com o relatório do período: cabeçalho com o período e a data em que foi gerado, os números, e uma tabela por dia (hora, o que foi feito, cliente ou quem pediu, tipo e tempo). Respeita o filtro e a busca da tela, numera as páginas e lê bem também em preto e branco. Para salvar o arquivo, escolha "Salvar como PDF" no destino da impressão.
- **Prévia:** clicar na linha abre o card, só para leitura. Uma demanda não planejada abre um resumo: quem pediu, quando foi capturada e finalizada, o tempo gasto e o que foi feito.
- **Ações da linha:** ao passar o mouse numa tarefa aparecem **Voltar ao quadro** (devolve para A fazer) e **Excluir** (pede um segundo clique).

## Configurações

A janela tem um painel à esquerda com as seções. Cada seção mostra à direita o que ela controla, com uma linha de explicação embaixo do título.

- **Tarefas:** quanto tempo a tarefa fica em Concluído antes de ir para o Histórico (1, 3, 7 ou 14 dias).
- **Aparência:** tema claro, escuro ou automático (segue o sistema).
- **Clientes:** a lista de clientes que aparece no Novo card (Projeto) e no filtro da lista. O cliente é opcional: uma tarefa pode não ter nenhum. Também dá para criar um cliente novo direto na Nova tarefa ou no card.
- **Tipos de tarefa:** a lista de tipos de entrega (Post, Carrossel, Vídeo…), que você pode editar.
- **Atalho:** aparece só no Windows com WSL. Veja [Atalho na área de trabalho](#atalho-na-área-de-trabalho).
- **Dicas de IA:** os três prompts para organizar ideias, conversas e tarefas com uma IA gratuita, com o jeito de pedir em cada chat. A seção também tem a opção **Mostrar ou Não mostrar** a dica do dia. Os prompts completos estão em [prompt-ia.md](prompt-ia.md).

As sugestões de **Quem pediu** não ficam nas configurações: na Captura rápida, cada sugestão tem um `×` que a tira da lista. Isso não muda os pedidos já registrados, e quando você usa esse nome de novo, ele volta às sugestões.

## Avisos

Os avisos aparecem embaixo, no centro da tela, e somem sozinhos: em cerca de 3,5 segundos os simples, em 6 segundos os de erro e em 8 segundos os que têm ação (como **Desfazer**). Com o mouse em cima do aviso, o tempo para. Você também pode fechar com o `×`.

**Dica do dia:** uma vez por dia, ao abrir o app, aparece um aviso com uma dica sobre IA gratuita. O botão **Ver dica** abre as Configurações na seção Dicas de IA. O botão **Não exibir novamente** desliga a dica do dia; para ligar de novo, use **Mostrar** na seção Dicas de IA. Essa escolha fica guardada no navegador.

Quando há uma versão nova do repositório, aparece um aviso e um botão com um ponto verde no topo. Ele mostra como atualizar: o DONELY confere o GitHub ao abrir e a cada 6 horas. Os seus dados não mudam na atualização.

## Seus dados

Tudo fica na sua máquina, sem nuvem e sem conta. Nada sai dela.

- Os dados ficam na pasta `app/dados/`: tarefas, checklist, histórico, demandas, clientes, configurações, o Caderno (pessoas, anotações e rascunhos) e também os arquivos anexados.
- Excluir uma tarefa apaga também o checklist, os anexos e o histórico dela. Não há lixeira: a exclusão é definitiva.
- Para usar outro arquivo de banco, defina `DONELY_DB` no `app/.env` (veja `app/.env.example`).

## Backup

Ninguém faz backup por você: se o computador ou o WSL forem perdidos, os dados vão junto. Faça uma cópia toda semana e sempre antes de trocar de computador.

**O que copiar:** a pasta `app/dados/` inteira. Dentro dela há o `donely.db` e, às vezes, dois arquivos de apoio (`donely.db-wal` e `donely.db-shm`). Copie a pasta toda, nunca só o `.db`.

**Sempre com o DONELY desligado** (botão Desligar no topo, ou `Ctrl+C` no terminal). Com ele ligado, a cópia pode sair incompleta.

### Pelo Windows, sem terminal

1. Desligue o DONELY.
2. Abra o Explorador de Arquivos e cole na barra de endereço o caminho da pasta do app no WSL. Por exemplo:
   `\\wsl.localhost\Ubuntu\home\SEU-USUÁRIO\projects\wrmax\donely\app`
   (troque `Ubuntu` pela sua distro e o resto pelo lugar onde você clonou o projeto).
3. Copie a pasta `dados` e cole num lugar seguro: pendrive, OneDrive, Google Drive. Ponha a data no nome, por exemplo `dados-2026-10-24`.

### Pelo terminal

Na pasta do projeto, com o DONELY desligado:

```bash
cp -r app/dados "$HOME/backup-donely-$(date +%F)"
```

Para salvar direto nos Documentos do Windows (troque `SEU-USUÁRIO`):

```bash
cp -r app/dados "/mnt/c/Users/SEU-USUÁRIO/Documents/backup-donely-$(date +%F)"
```

### Restaurar um backup

1. Desligue o DONELY.
2. Renomeie a pasta atual `app/dados` para `app/dados-antigo`, por segurança.
3. Copie a pasta do backup para dentro de `app/` com o nome `dados`.
4. Abra o DONELY. Se tudo estiver certo, pode apagar a `dados-antigo`.

**Trocar de computador** é o mesmo caminho: instale o DONELY no computador novo, rode uma vez, desligue e restaure o backup.

## Atalho na área de trabalho

No Windows com WSL, crie o atalho uma vez. O jeito mais fácil é pelo próprio app: abra **Configurações**, escolha a seção **Atalho** no painel da esquerda e clique em **Criar atalho**. A seção só aparece quando o DONELY roda no WSL.

Pelo terminal, o mesmo atalho sai com:

```bash
bash scripts/criar-atalho.sh
```

Se você mudar a pasta do projeto de lugar, crie o atalho de novo.

Aparece **DONELY** na área de trabalho, com o ícone da marca. Ao clicar, ele:

1. instala as dependências, só na primeira vez;
2. sobe o app (`npm run dev`), numa janela de logs que abre minimizada;
3. abre o navegador em `http://localhost:5173`. Se o app já estiver aberto, só abre o navegador.

Aberto pelo atalho, o topo ganha o botão **Desligar** (ícone de energia), ao lado de Configurações. Ele pede um segundo clique e encerra tudo: servidor, interface e a janela de logs. Fechar a janela de logs também desliga o app. Quem sobe o app pelo terminal não vê o botão e para com `Ctrl+C`.

## Usando no WSL

Se `localhost:3333` não abrir no navegador do Windows, confira se o encaminhamento de localhost do WSL está ligado (`localhostForwarding=true` no `.wslconfig`) ou abra o navegador dentro do próprio WSL.
