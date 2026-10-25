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
| `POST /tarefas` | `titulo` (obrigatório), `notas`, `cliente`, `tipo`, `prioridade`, `prazo`, `status`, `checklist` (lista de textos) | Cria uma tarefa. O prazo não pode estar no passado. Devolve `201`. |
| `PATCH /tarefas/:id` | qualquer um de `titulo`, `notas`, `cliente`, `tipo`, `prioridade`, `prazo` | Edita os campos enviados. |
| `POST /tarefas/:id/mover` | `status`: `a_fazer`, `fazendo` ou `concluido` | Muda a etapa. |
| `POST /tarefas/:id/arquivar` | — | Manda uma tarefa concluída para o Histórico na hora. |
| `DELETE /tarefas/:id` | — | Exclui a tarefa e tudo o que é dela. Devolve `204`. |

**Prioridades:** `urgente`, `alta`, `normal`.

### Checklist e links

| Método e rota | Corpo | O que faz |
|---|---|---|
| `POST /tarefas/:id/checklist` | `texto` | Adiciona um item. |
| `PATCH /tarefas/:id/checklist/:item` | `feito` (verdadeiro ou falso) | Marca ou desmarca. |
| `DELETE /tarefas/:id/checklist/:item` | — | Remove o item. |
| `POST /tarefas/:id/links` | `url` (http ou https), `rotulo` | Adiciona um link. |
| `DELETE /tarefas/:id/links/:link` | — | Remove o link. |

### Anexos

| Método e rota | O que faz |
|---|---|
| `POST /tarefas/:id/anexos?papel=material` | Envia um arquivo. O corpo é o próprio arquivo; o tipo vem do `Content-Type` e o nome do cabeçalho `x-nome` (codificado para URL). `papel=referencia` guarda como referência; sem ele, como material produzido. Limite de 100 MB (`413` acima disso). |
| `GET /anexos/:id` | Baixa ou mostra o arquivo. |
| `DELETE /tarefas/:id/anexos/:anexo` | Remove o arquivo. |

## Demandas (não planejadas)

As rotas de demanda devolvem a lista inteira, porque iniciar uma demanda pausa a que estava rodando.

| Método e rota | Corpo | O que faz |
|---|---|---|
| `POST /demandas` | `descricao` (obrigatório), `origem` (quem pediu), `prioridade`: `normal` ou `urgente` | Registra um pedido. Devolve `201`. |
| `POST /demandas/:id/iniciar` | — | Inicia o cronômetro (e pausa a outra, se houver). |
| `POST /demandas/:id/pausar` | — | Pausa o cronômetro. |
| `POST /demandas/:id/concluir` | — | Conclui a demanda. |

## Clientes e configurações

| Método e rota | Corpo | O que faz |
|---|---|---|
| `POST /clientes` | `nome` (obrigatório) | Cadastra um cliente. Devolve `201`, ou `409` se o nome já existe. |
| `DELETE /clientes/:id` | — | Remove o cliente. Devolve `204`. |
| `PATCH /config` | qualquer um de `arquivarAposDias` (1, 3, 7 ou 14), `tipos`, `tema` (`claro`, `escuro` ou `auto`) | Salva as configurações enviadas. |

## Sistema

| Método e rota | O que faz |
|---|---|
| `POST /desligar` | Encerra o app inteiro (servidor e interface). Só existe quando o app foi aberto pelo atalho; senão, `404`. Responde `204` antes de desligar. O `GET /estado` traz `desligavel: true` nesse caso. |
| `POST /atalho` | Cria o atalho DONELY na área de trabalho do Windows (roda `scripts/criar-atalho.sh`) e devolve `{ caminho }`. Só existe no WSL; senão, `404`. Falha devolve `500` com a mensagem. O `GET /estado` traz `atalho: true` quando está disponível. |
