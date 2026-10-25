import { useRef, useState } from 'react';
import { LIMITE_ANEXO } from '../../shared/dominio';
import { Icone } from './Icone';

export interface ItemAnexo { chave: string; nome: string; tipo: string; url: string }

interface Props {
  itens: ItemAnexo[]; onAdicionar: (arquivos: File[]) => Promise<void> | void; onRemover: (chave: string) => void; somenteLeitura?: boolean;
  /** Textos da área de soltar e do estado vazio; o padrão é o do material produzido. */
  acao?: string; dica?: string; vazio?: string;
}

const extensao = (nome: string) => (nome.includes('.') ? nome.split('.').pop()!.slice(0, 4).toUpperCase() : 'ARQ');

/** Material produzido: arrastar, colar ou escolher arquivos de qualquer tipo (vídeo, foto, PDF…). */
export function MaterialProduzido({ itens, onAdicionar, onRemover, somenteLeitura, acao = 'Adicionar o que você produziu', dica = 'Vídeo, foto, PDF ou qualquer arquivo, até 100 MB. Arraste para cá, cole (Ctrl+V) ou clique.', vazio = 'Nenhum material ainda.' }: Props) {
  const entrada = useRef<HTMLInputElement>(null);
  const [recusa, setRecusa] = useState('');
  const [sobre, setSobre] = useState(false);
  const [enviando, setEnviando] = useState(false);

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
              <a href={a.url} target="_blank" rel="noopener noreferrer" title={a.nome}>
                {a.tipo.startsWith('image/') ? <img src={a.url} alt="" />
                  : <span className={`anexo-icone ${a.tipo.startsWith('video/') ? 'anexo-video' : ''}`}>{a.tipo.startsWith('video/') ? <Icone nome="play" tamanho={22} /> : extensao(a.nome)}</span>}
                <span className="anexo-nome">{a.nome}</span>
              </a>
              {!somenteLeitura && <button type="button" className="anexo-remover" onClick={() => onRemover(a.chave)} aria-label={`Remover ${a.nome}`}><Icone nome="x" tamanho={12} /></button>}
            </li>
          ))}
        </ul>
      )}
      {somenteLeitura ? !itens.length && <p className="galeria-vazia">{vazio}</p> : <>
      <button type="button" className="material-soltar" onClick={() => entrada.current?.click()} disabled={enviando}>
        <Icone nome="clipe" tamanho={18} />
        <span><strong>{enviando ? 'Enviando…' : acao}</strong>
          <span>{dica}</span></span>
      </button>
      <input ref={entrada} type="file" hidden multiple onChange={(e) => { if (e.target.files) receber(e.target.files); e.target.value = ''; }} />
      </>}
      {recusa && <p className="erro-campo" role="status">{recusa}</p>}
    </div>
  );
}
