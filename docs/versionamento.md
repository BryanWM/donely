# Versão e atualizações

## A versão do DONELY

A versão instalada aparece no topo, ao lado da marca (por exemplo, `ver. 1.0.0`). Ela vem do campo `version` de [app/package.json](../app/package.json) e segue o padrão `MAJOR.MINOR.PATCH`:

| Parte | Quando sobe | Exemplo |
|---|---|---|
| **PATCH** | Correção de bug ou ajuste pequeno, sem função nova | `2.1.0` → `2.1.1` |
| **MINOR** | Função nova ou melhoria relevante, sem quebrar o que já existe | `2.1.1` → `2.2.0` |
| **MAJOR** | Mudança estrutural grande, ou que quebra compatibilidade (dados, atalho, forma de rodar) | `2.9.0` → `3.0.0` |

Ao subir uma parte, as da direita voltam a zero.

### Como lançar uma versão

1. Escolha a parte que sobe, pela tabela acima.
2. Dentro de `app/`, rode `npm version patch --no-git-tag-version` (ou `minor`, ou `major`). O comando só muda `app/package.json` e `app/package-lock.json`.
3. Faça o commit junto com as mudanças da versão e dê push na `main`.

> Os critérios ainda estão em ajuste. A versão `1.0.0` marca o início do versionamento. Mudanças de critério entram aqui.

## Verificação de atualizações

Ao iniciar, seja por `npm start` ou pelo atalho, o servidor compara a cópia instalada com a branch `main` de `github.com/BryanWM/donely` ([app/src/server/atualizacao.ts](../app/src/server/atualizacao.ts)):

1. `git fetch` da `main`, direto do endereço do repositório, mesmo que o clone tenha outro `origin`. O fetch só traz a `main` para dentro do `.git`. Ele não mexe nos arquivos, no branch atual nem nos dados.
2. Conta os commits da `main` que a cópia não tem. Se for zero, está em dia (quem está à frente da `main` também conta como em dia).
3. Lê a versão da `main` e os títulos das alterações que faltam.

O resultado sai no terminal:

- `Versão 1.0.0: em dia com a main.`
- `Atualização disponível: a main tem 3 alteração(ões) que esta cópia (versão 1.0.0) não tem.`
- `Não foi possível verificar atualizações (tentativa 1): …`. Sem rede, sem git ou fora de um clone, a verificação falha em silêncio na interface. Ela tenta de novo em 1 e em 2 minutos, e depois a cada hora.

Em dia, a interface não mostra nada. Desatualizado, aparece um alerta âmbar no topo e um aviso uma vez. O alerta abre a janela **Atualização disponível**, com a versão instalada, a da `main`, a lista de alterações e o passo a passo para atualizar. A interface pergunta o resultado ao abrir e a cada 2 minutos.

**O comando de atualizar depende do terminal.** Na janela, a pessoa escolhe onde roda o DONELY: WSL, Linux, macOS, CMD ou PowerShell. A janela já abre no terminal que o servidor detecta (Windows sem WSL abre em PowerShell). A pasta no comando é a da instalação de quem está usando.

| Terminal | Comando |
|---|---|
| WSL, Linux, macOS | `cd "<pasta>" && git pull && cd app && npm install` |
| CMD | `cd /d "<pasta>" && git pull && cd app && npm install` (o `/d` troca de drive junto) |
| PowerShell | `cd "<pasta>"; git pull; if ($?) { cd app; npm install }` (o PowerShell 5.1 não tem `&&`) |

**Atualizar pela interface:** o botão que atualiza direto pelo app ainda depende de definir o comportamento. Por enquanto, a janela mostra o comando para copiar.
