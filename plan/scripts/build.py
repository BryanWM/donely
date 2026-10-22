#!/usr/bin/env python3
"""Gera os HTML publicáveis em dist/ trocando o marcador __LOGO__ pelo logo em assets/."""
import base64
import pathlib

raiz = pathlib.Path(__file__).resolve().parent.parent
logo = base64.b64encode((raiz / "assets/wrmax-logo.png").read_bytes()).decode()
(raiz / "dist").mkdir(exist_ok=True)

paginas = {
    "prototipos/demandas-equipe/src.html": "demandas-equipe.html",
    "prototipos/quadro-pessoal/src.html": "quadro-pessoal.html",
}
for origem, destino in paginas.items():
    html = (raiz / origem).read_text(encoding="utf-8").replace("__LOGO__", logo)
    (raiz / "dist" / destino).write_text(html, encoding="utf-8")
    print(f"gerado dist/{destino} ({len(html)} caracteres)")
