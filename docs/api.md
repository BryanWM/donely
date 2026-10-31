# API

O servidor local expõe uma API JSON em `http://localhost:3333/api`. Ela existe para a interface do DONELY: só aceita pedidos desta máquina e da própria interface (veja [Segurança](arquitetura.md#segurança)).

O código fica em `app/src/server/api.ts`.

## Convenções

- Corpos em JSON, validados com Zod. Um corpo inválido devolve `400` com `{ "erro": "mensagem" }`, a mensagem do primeiro problema.
- Tarefa inexistente devolve `404` com `{ "erro": "Tarefa não encontrada" }`.
- Rotas que mudam uma tarefa devolvem a tarefa inteira, já atualizada.
- Datas de prazo usam `AAAA-MM-DD`; datas de eventos usam ISO 8601.
- Alguns erros trazem também um `codigo` (por exemplo, `sem_material`, `em_andamento`), para a interface decidir o que mostrar.

## Estado

| Método e rota | O que faz |
|---|---|
| `GET /estado` | Devolve tudo: `{ tarefas, demandas, config, clientes }`. |

## Tarefas

| Método e rota | Corpo | O que faz |
|---|---|---|
| `POST /tarefas` | `modelo` (`projeto`, padrão, ou `rapido`), `titulo` (obrigatório), `notas`, `cliente`, `tipo`, `prioridade`, `prazo`, `status`, `checklist` (lista de textos) | Cria uma tarefa. O prazo não pode estar no passado. Devolve `201`. No `rapido`, o `cliente` é descartado; o `tipo` é aceito e opcional. |
| `PATCH /tarefas/:id` | qualquer um de `titulo`, `notas`, `cliente`, `tipo`, `prioridade`, `prazo` | Edita os campos enviados. Em tarefa `rapido`, `cliente` é ignorado. O modelo não muda depois de criada. |
| `POST /tarefas/:id/mover` | `status`: `a_fazer`, `fazendo` ou `concluido` | Muda a etapa. |
| `POST /tarefas/:id/arquivar` | — | Manda uma tarefa concluída para o Histórico na hora. |
| `DELETE /tarefas/:id` | — | Exclui a tarefa e tudo o que é dela. Devolve `204`. |

**Prioridades:** `urgente`, `alta`, `normal`. No card rápido, `normal` quer dizer sem prioridade.

**Modelos:** `projeto` (completo) e `rapido` (título, descrição, tipo, prazo, prioridade e checklist). Tarefas anteriores à existência do modelo são `projeto`.

### Checklist

| Método e rota | Corpo | O que faz |
|---|---|---|
| `POST /tarefas/:id/checklist` | `texto` | Adiciona um item. |
| `PATCH /tarefas/:id/checklist/:item` | `feito` (verdadeiro ou falso) e/ou `texto` (pelo menos um dos dois) | Marca ou desmarca, e/ou corrige o texto do item. Sem nenhum dos dois, `400`. |
| `DELETE /tarefas/:id/checklist/:item` | — | Remove o item. |

### Anexos

| Método e rota | O que faz |
|---|---|
| `POST /tarefas/:id/anexos?papel=material` | Envia um arquivo. O corpo é o próprio arquivo; o tipo vem do `Content-Type` e o nome do cabeçalho `x-nome` (codificado para URL). `papel=referencia` guarda como referência; sem ele, como material produzido. Limite de 100 MB (`413` acima disso). |
| `POST /tarefas/:id/anexos/link` | `url` (http ou https, obrigatório), `nome` (opcional; sem ele, fica o endereço do site), `papel` (`material` ou `referencia`) | Anexa um link no lugar de um arquivo. Devolve `201`. |
| `GET /anexos/:id` | Baixa ou mostra o arquivo. Para um link, redireciona para o endereço. |
| `DELETE /tarefas/:id/anexos/:anexo` | Remove o arquivo. |

## Demandas (não planejadas)

As rotas de demanda devolvem a lista inteira, porque iniciar uma demanda pausa a que estava rodando.

| Método e rota | Corpo | O que faz |
|---|---|---|
| `POST /demandas` | `descricao` (obrigatório), `origem` (quem pediu), `prioridade`: `normal` ou `urgente` | Registra um pedido. Devolve `201`. |
| `POST /demandas/:id/iniciar` | — | Inicia o cronômetro (e pausa a outra, se houver). |
| `POST /demandas/:id/pausar` | — | Pausa o cronômetro. |
| `POST /demandas/:id/concluir` | `registro` (opcional): o que foi feito | Conclui a demanda, gravando o registro se vier. |
| `PATCH /demandas/:id` | `registro` | Escreve ou corrige o registro, inclusive de uma demanda já concluída. |

## Clientes e configurações

| Método e rota | Corpo | O que faz |
|---|---|---|
| `POST /clientes` | `nome` (obrigatório) | Cadastra um cliente. Devolve `201`, ou `409` se o nome já existe. |
| `DELETE /clientes/:id` | — | Remove o cliente. Devolve `204`. |
| `PATCH /config` | qualquer um de `arquivarAposDias` (1, 3, 7 ou 14), `tipos`, `tema` (`claro`, `escuro` ou `auto`), `origensOcultas` (lista de nomes tirados das sugestões de "Quem pediu") | Salva as configurações enviadas. |

## Caderno

| Método e rota | Corpo | O que faz |
|---|---|---|
| `GET /notas` | — | Devolve `{ pessoas, anotacoes }`. |
| `POST /pessoas` | `nome` (obrigatório) | Cadastra uma pessoa. Devolve `201`, ou `409` se o nome já existe. |
| `POST /pessoas/:id/anotacoes` | `conteudo` (obrigatório), `titulo` (opcional) | Cria uma anotação. Devolve `201`, ou `404` se a pessoa não existe. |
| `PATCH /anotacoes/:id` | `conteudo` (obrigatório), `titulo` | Edita a anotação. |
| `DELETE /anotacoes/:id` | — | Remove a anotação. Devolve `204`. |
| `GET /rascunhos` | — | Lista os rascunhos, do mais recente para o mais antigo. |
| `POST /rascunhos` | `titulo`, `conteudo`, `vinculo` (opcional: `{ tipo: 'cliente' ou 'tarefa', id }`) | Cria um rascunho. Devolve `201`. |
| `PATCH /rascunhos/:id` | qualquer um dos campos acima; `vinculo: null` remove o vínculo; `tags` é a lista completa de tags (até 20, cada uma de até 30 caracteres) | Edita o rascunho. Quem não envia `tags` mantém as atuais. |
| `DELETE /rascunhos/:id` | — | Remove o rascunho. Devolve `204`. |

## Sistema

| `GET /versao` | Devolve o resultado da última verificação contra a `main` do GitHub, feita pelo servidor ao iniciar e a cada hora: `{ atual, desatualizada }` e, quando desatualizada, `pasta`, `disponivel` (versão da `main`), `faltam` (commits que faltam) e `alteracoes` (`{ hash, titulo }`, até 20). Sem git, sem internet ou fora de um clone, responde que está em dia. Veja [Versão e atualizações](versionamento.md). |
| `POST /desligar` | Encerra o app inteiro (servidor e interface). Só existe quando o app foi aberto pelo atalho; senão, `404`. Responde `204` antes de desligar. O `GET /estado` traz `desligavel: true` nesse caso. |
| `POST /atalho` | Cria o atalho DONELY na área de trabalho do Windows (roda `scripts/criar-atalho.sh`) e devolve `{ caminho }`. Só existe no WSL; senão, `404`. Falha devolve `500` com a mensagem. O `GET /estado` traz `atalho: true` quando está disponível. |
