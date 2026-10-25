#!/usr/bin/env bash
# Abre o DONELY: instala as dependências na primeira vez, sobe o app (npm run dev) e abre o navegador.
# É o que o atalho da área de trabalho executa (veja scripts/criar-atalho.sh). Fecha sozinho quando o app é desligado.
set -euo pipefail

APP="$(cd "$(dirname "${BASH_SOURCE[0]}")/../app" && pwd)"
URL="http://localhost:5173"

# o atalho abre um bash sem o perfil interativo: carrega o nvm à mão
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

abrir() { cmd.exe /c start "" "$URL" >/dev/null 2>&1 || xdg-open "$URL" >/dev/null 2>&1 || echo "Abra $URL no navegador."; }

# já está rodando: só abre o navegador
if curl -fs -o /dev/null "$URL"; then abrir; exit 0; fi

cd "$APP"
[ -d node_modules ] || { echo "Primeira vez: instalando as dependências..."; npm install; }

# Sobe tudo num grupo de processos próprio (setsid). O servidor recebe o número do grupo em DONELY_PGID,
# e o botão Desligar da interface encerra o grupo inteiro: servidor, interface e este script.
# --wait: o setsid pode se duplicar, e sem ele o `wait` abaixo voltaria na hora; o número do grupo vem num arquivo.
GRUPO_ARQ="$(mktemp)"
setsid --wait bash -c 'echo $$ > "$1"; export DONELY_PGID=$$; exec npm run dev' _ "$GRUPO_ARQ" &
APP_PID=$!

echo "Subindo o DONELY..."
for _ in $(seq 1 60); do
  curl -fs -o /dev/null "$URL" && break
  sleep 1
done
abrir

# segura a janela aberta enquanto o app roda; fechar a janela também desliga o app
trap 'kill -- -"$(cat "$GRUPO_ARQ" 2>/dev/null)" 2>/dev/null; rm -f "$GRUPO_ARQ"' EXIT
wait $APP_PID || true
