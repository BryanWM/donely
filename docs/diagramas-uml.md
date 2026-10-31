# Diagramas UML do DONELY

Os diagramas são escritos em Mermaid, então o GitHub e a maioria dos editores Markdown os desenham direto do texto. Eles descrevem o código atual: `app/src/shared/dominio.ts` (regras e tipos) e `app/src/server/repositorio.ts` (operações).

1. [Caso de uso](#1-caso-de-uso)
2. [Classes](#2-classes)
3. [Atividades](#3-atividades)
4. [Estados](#4-estados)

---

## 1. Caso de uso

Quem usa o app é uma só pessoa, então há um único ator. O servidor local aparece como ator secundário, para as ações que dependem do sistema operacional.

```mermaid
flowchart LR
  P(["Pessoa usuária"])
  S(["Servidor local"])

  subgraph Quadro
    UC1(("Criar card Rápido"))
    UC2(("Criar card Projeto"))
    UC3(("Mover card entre colunas"))
    UC4(("Editar card"))
    UC5(("Marcar itens do checklist"))
    UC6(("Anexar arquivo ou link"))
    UC7(("Arquivar ou excluir card"))
  end

  subgraph Demandas
    UC8(("Capturar demanda"))
    UC9(("Iniciar, pausar e concluir demanda"))
  end

  subgraph Caderno
    UC10(("Registrar ideia"))
    UC11(("Escrever anotação por pessoa"))
  end

  subgraph Configurações
    UC12(("Configurar tema, clientes e tipos"))
    UC13(("Consultar dicas de IA"))
  end

  P --- UC1
  P --- UC2
  P --- UC3
  P --- UC4
  P --- UC5
  P --- UC6
  P --- UC7
  P --- UC8
  P --- UC9
  P --- UC10
  P --- UC11
  P --- UC12
  P --- UC13
  S --- UC14(("Verificar nova versão"))
  S --- UC15(("Criar atalho e desligar (WSL)"))
```

Pontos de leitura:

- "Editar card" cobre os dois modelos. O card Rápido não tem cliente, e o servidor descarta esse campo ao salvar (`SO_PROJETO` em `repositorio.ts`).
- Cada item do checklist é marcado ou editado sem abrir o card inteiro.

---

## 2. Classes

Diagrama de classes do domínio, com os tipos de `dominio.ts`. Os métodos ficam fora porque as operações estão no repositório, não nos tipos.

```mermaid
classDiagram
  class Tarefa {
    +id: string
    +modelo: Modelo
    +titulo: string
    +notas: string
    +cliente: string
    +tipo: string
    +prioridade: Prioridade
    +prazo: string
    +status: Status
    +concluidoEm: string
    +arquivadaEm: string
    +criadoEm: string
    +atualizadoEm: string
  }

  class ItemChecklist {
    +id: string
    +texto: string
    +feito: boolean
  }

  class Evento {
    +em: string
    +texto: string
  }

  class Anexo {
    +id: string
    +nome: string
    +tipo: string
    +tamanho: number
    +papel: PapelAnexo
    +url: string
  }

  class Cliente {
    +id: string
    +nome: string
  }

  class Demanda {
    +id: string
    +descricao: string
    +origem: string
    +prioridade: PrioridadeDemanda
    +capturadaEm: string
    +iniciadaEm: string
    +tempoMs: number
    +concluidaEm: string
    +registro: string
  }

  class Pessoa {
    +id: string
    +nome: string
  }

  class Anotacao {
    +id: string
    +titulo: string
    +conteudo: string
    +criadoEm: string
    +atualizadoEm: string
  }

  class Rascunho {
    +id: string
    +titulo: string
    +conteudo: string
    +criadoEm: string
    +atualizadoEm: string
  }

  class Config {
    +arquivarAposDias: number
    +tipos: string[]
    +tema: Tema
    +origensOcultas: string[]
  }

  class Status {
    <<enumeration>>
    a_fazer
    fazendo
    concluido
  }

  class Modelo {
    <<enumeration>>
    projeto
    rapido
  }

  class Prioridade {
    <<enumeration>>
    urgente
    alta
    normal
  }

  class PapelAnexo {
    <<enumeration>>
    material
    referencia
  }

  class EstadoDemanda {
    <<enumeration>>
    pendente
    em_execucao
    concluida
  }

  Tarefa "1" *-- "0..*" ItemChecklist : checklist
  Tarefa "1" *-- "0..*" Evento : histórico
  Tarefa "1" *-- "0..*" Anexo : anexos
  Tarefa "0..*" --> "0..1" Cliente : cliente (pelo nome)
  Tarefa --> Status
  Tarefa --> Modelo
  Tarefa --> Prioridade
  Anexo --> PapelAnexo
  Demanda --> EstadoDemanda : estado derivado
  Pessoa "1" *-- "0..*" Anotacao
  Rascunho "0..*" --> "0..1" Cliente : vínculo opcional
  Rascunho "0..*" --> "0..1" Tarefa : vínculo opcional
```

Pontos de leitura:

- `Tarefa.cliente` guarda o nome, não um identificador. Por isso a associação com `Cliente` é pelo nome, e renomear um cliente não atualiza os cards.
- `Demanda` não tem campo de estado: `estadoDemanda()` deriva o estado de `iniciadaEm` e `concluidaEm`.

---

## 3. Atividades

Fluxo de uma tarefa, do cadastro até o Histórico. Excluir é possível em qualquer etapa e não aparece aqui.

```mermaid
flowchart TD
  A((Início)) --> B[Clicar em Novo card]
  B --> C{Rápido ou Projeto?}
  C -->|Rápido| D[Preencher título, descrição, prazo, prioridade e checklist]
  C -->|Projeto| E[Preencher cliente, tipo, prioridade, prazo, briefing e checklist]
  D --> F{Título preenchido?}
  E --> F
  F -->|Não| G[Pedir o título] --> F
  F -->|Sim| H[Salvar card em A fazer]
  H --> I[Mover para Fazendo]
  I --> J{Terminou?}
  J -->|Não| I
  J -->|Sim| K[Mover para Concluído e gravar a data]
  K --> L{Arquivar agora?}
  L -->|Sim| M[Arquivar no Histórico]
  L -->|Não| N[Espera o número de dias configurado]
  N --> M
  M --> Z((Fim))
```

Pontos de leitura:

- O arquivamento automático não é uma ação: o card sai do quadro quando `dias >= arquivarAposDias` (`estaArquivada` em `dominio.ts`).
- Mover para uma coluna que não seja Concluído limpa a data de conclusão. Por isso o card volta a contar como aberto.

---

## 4. Estados

### 4.1 Tarefa

O status é um dos três valores de `Status`. O arquivamento é uma condição sobre o estado Concluído, não um valor gravado no status.

```mermaid
stateDiagram-v2
  [*] --> a_fazer : criar
  a_fazer --> fazendo : mover
  fazendo --> a_fazer : mover
  a_fazer --> concluido : mover
  fazendo --> concluido : mover
  concluido --> fazendo : mover (zera a conclusão)
  concluido --> a_fazer : mover (zera a conclusão)

  state concluido {
    [*] --> no_quadro
    no_quadro --> no_historico : arquivar à mão ou dias >= arquivarAposDias
  }

  a_fazer --> [*] : excluir
  fazendo --> [*] : excluir
  concluido --> [*] : excluir
```

### 4.2 Demanda

O estado de uma demanda não planejada sai das datas `iniciadaEm` e `concluidaEm`. Só uma demanda pode estar em execução por vez: iniciar outra pausa a que estava rodando.

```mermaid
stateDiagram-v2
  [*] --> pendente : capturar
  pendente --> em_execucao : iniciar
  em_execucao --> pendente : pausar
  em_execucao --> concluida : concluir (registro opcional)
  pendente --> concluida : concluir
  concluida --> [*]
```

Depois de concluída, a demanda ainda aceita um registro escrito ou corrigido (`registrarDemanda`). Esse caso não muda o estado, então não aparece como transição.
