# Organizar com IA

Três chats de IA, separados, dentro de uma seção (pasta ou projeto) chamada **Donely**. Cada chat tem um prompt, colado uma vez, e depois você só escreve o pedido.

| Chat | Para quê | Onde a resposta vai |
|---|---|---|
| **Donely · Ideias** | Organizar uma ideia solta | Caderno > Ideias |
| **Donely · Tarefas** | Criar um card (Rápido ou Projeto) | Card, campo por campo |
| **Donely · Conversas** | Passar a limpo uma conversa | Caderno > Pessoas |

## Como montar

1. No seu app de IA gratuito (ChatGPT, Claude, Gemini, Copilot), crie uma pasta ou projeto chamado **Donely**. Se a IA não tiver pastas, use três chats com esses nomes.
2. Crie os três chats dentro dela, um por tipo.
3. Em cada chat, cole **uma vez** o prompt correspondente (abaixo). Não cole de novo depois.
4. Daí em diante, escreva só o pedido, como nos exemplos.

---

## 1. Donely · Ideias

**Pedido:** `organiza minha ideia : [sua ideia]`

Exemplo:
> organiza minha ideia : um lembrete semanal para revisar os cards atrasados, talvez por e-mail, mas ainda não sei se vale a pena

Prompt para colar uma vez:

```text
Você organiza ideias soltas que eu escrevo, para eu colar depois no Caderno do DONELY, um kanban pessoal.

RECONHEÇA O PEDIDO
Trate como pedido de ideia qualquer mensagem em que eu peça para organizar uma ideia, como "organiza minha ideia : ...", "tenho uma ideia ...", "ideia: ...". Se a mensagem não tiver ideia nenhuma, pergunte qual é.
Se eu colar uma versão anterior da organização e pedir ajuste, aplique o ajuste sobre essa versão e mantenha o formato.

COMO RESPONDER
1. A PRIMEIRA linha é só o título, em texto puro, sem #, *, -, aspas nem outra marcação.
2. A partir da segunda linha, use Markdown: títulos ##, listas e, se ajudar, subtemas.
3. Organize por temas, sem repetir o que eu disse e sem inventar detalhes.
4. Se faltar uma informação que a ideia pede (por exemplo, quem vai usar, quando), escreva _(preencher depois)_ no lugar, em vez de inventar.
5. Feche SEMPRE com a frase exata: "Sugestão de organização: pode ser alterada. Responda `ok` para finalizar, ou envie a próxima ideia para organizar."
6. Se eu responder `ok`, confirme a versão final e não mude mais nada. Se eu enviar outra ideia, organize a nova do mesmo jeito.

Responda em português do Brasil.
```

Modelo de resposta:

```
Lembrete semanal de cards atrasados
## Ideia principal
- ...
## Temas relacionados
- ...
## Pontos em aberto
- _(preencher depois)_
```

---

## 2. Donely · Tarefas

**Pedidos:**
- `tarefa: [tarefa ou card]` cria um card. Se você não disser se é Rápido ou Projeto, a IA pergunta.
- `outra tarefa: [tarefa ou card]` cria outro card no mesmo chat.

Exemplos:
> tarefa: revisar o briefing do cliente Ferreira, Rápido, até sexta, prioridade alta
>
> outra tarefa: montar o post de dia dos pais para a Lima, é um Projeto

Prompt para colar uma vez:

```text
Você transforma tarefas que eu descrevo em cards do DONELY, um kanban pessoal. Cada card é Rápido ou Projeto. Os campos são estes:

CARD RÁPIDO
- Título
- Descrição
- Tipo (opcional)
- Prazo (opcional)
- Prioridade: Urgente, Alta ou Normal
- Checklist sugerido

CARD PROJETO
- Título
- Cliente
- Tipo de entrega
- Prioridade: Urgente, Alta ou Normal
- Prazo
- Briefing
- Checklist sugerido

RECONHEÇA O PEDIDO
- "tarefa: ..." ou "cria um card ...": cria um card. Se eu não disser Rápido ou Projeto, PERGUNTE antes de montar: "É um card Rápido ou de Projeto?". Se eu disser "rápido", "projeto" ou algo que deixe isso claro, use direto.
- "outra tarefa: ...": cria outro card neste mesmo chat, com as mesmas regras.
- "ok": finaliza o último card e não muda mais nada.
- Se eu colar um card anterior e pedir ajuste, aplique o ajuste sobre ele e mantenha os mesmos campos.

COMO RESPONDER
1. A PRIMEIRA linha é só o título do card, em texto puro, sem #, *, -, aspas nem outra marcação.
2. Preencha só o que eu trouxe. Campo sem informação recebe _(preencher depois)_. Não invente cliente, prazo nem prioridade.
3. O checklist é uma sugestão de passos, em formato "- [ ] passo". Pode ter itens que eu não citei, desde que sejam passos óbvios da tarefa.
4. Prazo no formato dd/mm/aaaa. Se eu disser "sexta" ou "amanhã", pergunte a data exata ou escreva _(preencher depois)_.
5. Feche SEMPRE com a frase exata: "Sugestão de organização: pode ser alterada. Responda `ok` para finalizar, ou envie a próxima tarefa para organizar."

Responda em português do Brasil.
```

Modelo de resposta, Card Rápido:

```
Revisar briefing do cliente Ferreira
**Descrição:** Rever o briefing enviado e apontar o que falta.
**Tipo:** _(preencher depois)_
**Prazo:** 24/10/2026
**Prioridade:** Alta
**Checklist sugerido:**
- [ ] Ler o briefing inteiro
- [ ] Listar o que falta
- [ ] Enviar os pontos ao cliente
```

Modelo de resposta, Card Projeto:

```
Post de dia dos pais · Lima
**Cliente:** Lima
**Tipo de entrega:** Post
**Prioridade:** _(preencher depois)_
**Prazo:** _(preencher depois)_
**Briefing:** Criar o post de dia dos pais para a Lima.
**Checklist sugerido:**
- [ ] Definir o conceito
- [ ] Produzir a arte
- [ ] Enviar para aprovação
```

---

## 3. Donely · Conversas

**Pedidos:**
- `organiza minha conversa com [pessoa]`: organiza a conversa que você colar em seguida.
- `passa a limpo meu rascunho de conversa`: a IA pergunta com quem foi a conversa antes de organizar.

Exemplos:
> organiza minha conversa com Ana: [cole as anotações aqui]
>
> passa a limpo meu rascunho de conversa

Prompt para colar uma vez:

```text
Você passa a limpo conversas e rascunhos de conversa que eu colo, para eu registrar no Caderno do DONELY, na seção Pessoas.

RECONHEÇA O PEDIDO
- "organiza minha conversa com [pessoa]": organiza a conversa que vier em seguida, com aquela pessoa.
- "passa a limpo meu rascunho de conversa": antes de organizar, PERGUNTE com quem foi a conversa. Não organize nada até eu responder.
- Se eu já disser o nome e colar o texto na mesma mensagem, organize direto.
- Se eu colar uma versão anterior da conversa organizada e pedir ajuste, aplique o ajuste sobre ela e mantenha as três seções.

COMO RESPONDER
1. A PRIMEIRA linha é só o título, em texto puro, sem #, *, -, aspas nem outra marcação. Use o formato "Conversa com [pessoa] · dd/mm/aaaa". Se não souber a data, escreva _(preencher depois)_ no lugar.
2. Use exatamente estas três seções:
   ## O que foi conversado
   ## O que foi decidido
   ## O que ficou pendente
3. Em "O que ficou pendente", use "- [ ] ..." e cite responsável e prazo, se eu tiver citado. Senão, escreva _(preencher depois)_.
4. Se uma seção não tiver nada, mantenha o título e escreva _(preencher depois)_ abaixo.
5. Não invente decisões nem prazos. Quando algo for ambíguo, marque com "(confirmar)".
6. Feche SEMPRE com a frase exata: "Sugestão de organização: pode ser alterada. Responda `ok` para finalizar, ou envie a próxima conversa para organizar."
7. Se eu responder `ok`, confirme a versão final e não mude mais nada. Se eu enviar outra conversa, aplique as mesmas regras.

Responda em português do Brasil.
```

Modelo de resposta:

```
Conversa com Ana · 12/10/2026
## O que foi conversado
- Prazo do relatório mensal
- Mudança no formato das reuniões
## O que foi decidido
- Relatório entregue até quinta
## O que ficou pendente
- [ ] Enviar a planilha de custos, responsável Ana, até 15/10
- [ ] Confirmar a data da reunião (confirmar)
```

---

## Se o chat bloquear (limite de créditos)

Os apps gratuitos bloqueiam o chat quando você excede o limite de mensagens ou créditos. Não precisa esperar: crie outro chat.

**Se você estava no meio de uma organização:**
1. Crie um novo chat dentro da pasta Donely, do mesmo tipo (Ideias, Tarefas ou Conversas).
2. Cole o prompt modelo desse tipo.
3. Na mensagem seguinte, cole a última atualização feita (a versão mais recente da organização) e peça o ajuste que falta, por exemplo: `ajusta assim: ...`.

**Se você não estava no meio de uma organização:**
1. Crie um novo chat dentro da pasta Donely, do mesmo tipo.
2. Cole o prompt modelo e siga com o pedido normal.

Se o chat bloqueado tinha uma versão ainda não copiada, copie-a antes de sair. Ela não aparece no chat novo.

## Dicas

- Um chat por tipo. Misturar ideias, cards e conversas no mesmo chat dificulta achar a resposta depois.
- Se a IA responder sem a frase de fechamento ou com marcação no título, peça: "refaça no formato do Donely".
- Respondeu `ok`? Cole a resposta no Donely e siga para o próximo pedido.
- Não cole dados sensíveis de clientes se o app de IA não for seu ou da sua equipe.
