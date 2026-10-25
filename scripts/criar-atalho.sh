#!/usr/bin/env bash
# Cria o atalho DONELY na área de trabalho do Windows (rodando no WSL). Rode uma vez:
#   bash scripts/criar-atalho.sh
# O atalho executa scripts/iniciar.sh, que sobe o app e abre o navegador.
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
command -v powershell.exe >/dev/null || { echo "Este script é para o WSL: não achei o powershell.exe do Windows."; exit 1; }
chmod +x "$RAIZ/scripts/iniciar.sh"

ps() { powershell.exe -NoProfile -Command "$1" | tr -d '\r'; }
DESKTOP="$(ps "[Environment]::GetFolderPath('Desktop')")"
PASTA_WIN="$(ps '$env:LOCALAPPDATA')\\DONELY"
PASTA="$(wslpath -u "$PASTA_WIN")"
mkdir -p "$PASTA"

# Ícone do Windows (.ico) a partir dos PNGs da marca: o .ico guarda os PNGs como estão, um por tamanho.
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
node - "$RAIZ/brand/png" "$PASTA/donely.ico" <<'JS'
const fs = require('fs'), [pasta, destino] = process.argv.slice(2);
const pngs = [16, 32, 64, 192].map((t) => fs.readFileSync(`${pasta}/donely-icone-${t}.png`));
const cab = Buffer.alloc(6 + 16 * pngs.length);
cab.writeUInt16LE(1, 2); cab.writeUInt16LE(pngs.length, 4);
let pos = cab.length;
pngs.forEach((png, i) => {
  const w = png.readUInt32BE(16), h = png.readUInt32BE(20), e = 6 + 16 * i;
  cab[e] = w >= 256 ? 0 : w; cab[e + 1] = h >= 256 ? 0 : h;
  cab.writeUInt16LE(1, e + 4); cab.writeUInt16LE(32, e + 6);
  cab.writeUInt32LE(png.length, e + 8); cab.writeUInt32LE(pos, e + 12);
  pos += png.length;
});
fs.writeFileSync(destino, Buffer.concat([cab, ...pngs]));
JS

# O atalho chama o wsl.exe, que roda o iniciar.sh nesta distro; a janela de logs abre minimizada.
ps "\$s = (New-Object -ComObject WScript.Shell).CreateShortcut('$DESKTOP\\DONELY.lnk');
\$s.TargetPath = \"\$env:WINDIR\\System32\\wsl.exe\";
\$s.Arguments = '-d $WSL_DISTRO_NAME -- bash \"$RAIZ/scripts/iniciar.sh\"';
\$s.IconLocation = '$PASTA_WIN\\donely.ico';
\$s.Description = 'Abrir o DONELY';
\$s.WindowStyle = 7;
\$s.Save()"

echo "Atalho criado: $DESKTOP\\DONELY.lnk"
