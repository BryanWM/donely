import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { InfoVersao } from '../shared/dominio';

/** O repositório oficial: a comparação é sempre com a main dele, mesmo que o clone tenha outro "origin". */
export const REPOSITORIO = 'https://github.com/BryanWM/donely.git';

// GIT_TERMINAL_PROMPT=0: sem rede ou sem acesso, falha em vez de ficar esperando senha no terminal.
const git = (cwd: string, ...args: string[]) => new Promise<string>((ok, falha) => {
  execFile('git', args, { cwd, timeout: 20_000, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } },
    (erro, saida, avisos) => (erro ? falha(new Error(String(avisos).trim().split('\n').pop() || erro.message)) : ok(String(saida).trim())));
});

/** Só uma sugestão para a janela de atualização; a pessoa escolhe o terminal que usa. */
const SISTEMA: InfoVersao['sistema'] = process.env.WSL_DISTRO_NAME ? 'wsl'
  : process.platform === 'darwin' ? 'macos' : process.platform === 'win32' ? 'windows' : 'linux';

export const versaoInstalada =(raizApp: string): string => JSON.parse(readFileSync(join(raizApp, 'package.json'), 'utf8')).version;

/**
 * Compara o commit instalado com a main do GitHub. O fetch só baixa a main para dentro do .git (FETCH_HEAD):
 * não mexe nos arquivos, no branch atual nem nos dados. Desatualizada = falta aqui algum commit da main
 * (quem está à frente da main não é avisado).
 */
export async function conferirAtualizacao(raizApp: string): Promise<InfoVersao> {
  const atual = versaoInstalada(raizApp);
  await git(raizApp, 'fetch', '--quiet', REPOSITORIO, 'main');
  const faltam = Number(await git(raizApp, 'rev-list', '--count', 'HEAD..FETCH_HEAD'));
  if (!faltam) return { atual, desatualizada: false, sistema: SISTEMA };
  const log = await git(raizApp, 'log', '--format=%h%x09%s', '-n', '20', 'HEAD..FETCH_HEAD');
  const disponivel = await git(raizApp, 'show', 'FETCH_HEAD:app/package.json').then((t) => JSON.parse(t).version as string, () => undefined);
  return {
    atual, desatualizada: true, pasta: resolve(raizApp, '..'), sistema: SISTEMA, disponivel, faltam,
    alteracoes: log.split('\n').filter(Boolean).map((linha) => { const [hash, ...titulo] = linha.split('\t'); return { hash, titulo: titulo.join('\t') }; }),
  };
}
