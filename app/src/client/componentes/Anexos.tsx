import { useRef, useState, type FormEvent } from 'react';
import { LIMITE_ANEXO } from '../../shared/dominio';
import { Icone } from './Icone';

export interface ItemAnexo { chave: string; nome: string; tipo: string; url: string; /** Link externo no lugar de um arquivo. */ link?: boolean }

interface Props {
  itens: ItemAnexo[]; onAdicionar: (arquivos: File[]) => Promise<void> | void; onRemover: (chave: string) => void; somenteLeitura?: boolean;
  /** Com ela, a pessoa escolhe entre anexar arquivo ou link. Devolve se deu certo. */
  onAdicionarLink?: (url: string) => Promise<boolean>;
  /** Textos da área de soltar e do estado vazio; o padrão é o do material produzido. */
  acao?: string; dica?: string; vazio?: string;
}

const extensao = (nome: string) => (nome.includes('.') ? nome.split('.').pop()!.slice(0, 4).toUpperCase() : 'ARQ');

/** Material produzido: arrastar, colar ou escolher arquivos de qualquer tipo (vídeo, foto, PDF…). */
export function MaterialProduzido({ itens, onAdicionar, onAdicionarLink, onRemover, somenteLeitura, acao = 'Adicionar o que você produziu', dica = 'Vídeo, foto, PDF ou qualquer arquivo, até 100 MB. Arraste para cá, cole (Ctrl+V) ou clique.', vazio = 'Nenhum material ainda.' }: Props) {
  const entrada = useRef<HTMLInputElement>(null);
  const [recusa, setRecusa] = useState('');
  const [sobre, setSobre] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [modo, setModo] = useState<'arquivo' | 'link'>('arquivo');
  const [link, setLink] = useState('');

  async function anexarLink(e: FormEvent) {
    e.preventDefault();
    if (!onAdicionarLink || !/^https?:\/\/\S+$/i.test(link.trim())) { setRecusa('Cole um endereço completo, começando com http:// ou https://.'); return; }
    setRecusa(''); setEnviando(true);
    try { if (await onAdicionarLink(link.trim())) setLink(''); } finally { setEnviando(false); }
  }

  async function receber(lista: FileList | File[]) {
    if (somenteLeitura) return; // em "A fazer" nada é anexado, nem colando ou arrastando
    const todos = [...lista], ok = todos.filter((f) => f.size <= LIMITE_ANEXO);
    setRecusa(ok.length < todos.length ? 'Arquivos acima de 100 MB ficaram de fora.' : '');
    if (!ok.length) return;
    setEnviando(true);
    try { await onAdicionar(ok); } finally { setEnviando(false); }
  }

  return (
    <div className={`material ${sobre ? 'sobre' : ''}`}
      onPaste={(e) => { if (e.clipboardData.files.length) { e.preventDefault(); receber(e.clipboardData.files); } }}
      onDragOver={(e) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setSobre(true); } }}
      onDragLeave={() => setSobre(false)}
      onDrop={(e) => { if (!e.dataTransfer.files.length) return; e.preventDefault(); setSobre(false); receber(e.dataTransfer.files); }}>
      {itens.length > 0 && (
        <ul className="anexos-lista">
          {itens.map((a) => (
            <li key={a.chave} className="anexo">
              <a href={a.url} target="_blank" rel="noopener noreferrer" title={a.link ? `${a.nome} · ${a.url}` : a.nome}>
                {a.link ? <span className="anexo-icone anexo-link"><Icone nome="link" tamanho={22} /></span>
                  : a.tipo.startsWith('image/') ? <img src={a.url} alt="" />
                  : <span className={`anexo-icone ${a.tipo.startsWith('video/') ? 'anexo-video' : ''}`}>{a.tipo.startsWith('video/') ? <Icone nome="play" tamanho={22} /> : extensao(a.nome)}</span>}
                <span className="anexo-nome">{a.nome}</span>
              </a>
              {!somenteLeitura && <button type="button" className="anexo-remover" onClick={() => onRemover(a.chave)} aria-label={`Remover ${a.nome}`}><Icone nome="x" tamanho={12} /></button>}
            </li>
          ))}
        </ul>
      )}
      {somenteLeitura ? !itens.length && <p className="galeria-vazia">{vazio}</p> : <>
      {onAdicionarLink && (
        <div className="segmentado material-modo" role="radiogroup" aria-label="Anexar">
          {(['arquivo', 'link'] as const).map((m) => (
            <button key={m} type="button" role="radio" aria-checked={modo === m} className={modo === m ? 'ativo' : ''} onClick={() => { setModo(m); setRecusa(''); }}>
              <Icone nome={m === 'arquivo' ? 'clipe' : 'link'} tamanho={14} />{m === 'arquivo' ? 'Arquivo' : 'Link'}
            </button>
          ))}
        </div>
      )}
      {modo === 'link' && onAdicionarLink ? (
        <form className="material-link" onSubmit={anexarLink} noValidate>
          <label className="sr" htmlFor="material-url">Link do material</label>
          <input id="material-url" type="url" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Cole o link: Drive, YouTube, Figma, WeTransfer…" autoComplete="off" />
          <button type="submit" className="btn principal pequeno" disabled={enviando || !link.trim()}>{enviando ? 'Anexando…' : 'Anexar link'}</button>
        </form>
      ) : <>
      <button type="button" className="material-soltar" onClick={() => entrada.current?.click()} disabled={enviando}>
        <Icone nome="clipe" tamanho={18} />
        <span><strong>{enviando ? 'Enviando…' : acao}</strong>
          <span>{dica}</span></span>
      </button>
      <input ref={entrada} type="file" hidden multiple onChange={(e) => { if (e.target.files) receber(e.target.files); e.target.value = ''; }} />
      </>}
      </>}
      {recusa && <p className="erro-campo" role="status">{recusa}</p>}
    </div>
  );
}
