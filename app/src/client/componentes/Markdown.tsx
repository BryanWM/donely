import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Texto do Caderno em Markdown (com tabelas e listas de tarefa). HTML escrito no texto não é interpretado. */
export function Markdown({ texto, className = '' }: { texto: string; className?: string }) {
  return (
    <div className={`markdown ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ node: _, ...p }) => <a {...p} target="_blank" rel="noopener noreferrer" /> }}>{texto}</ReactMarkdown>
    </div>
  );
}

/** Para prévias de uma ou duas linhas: tira os símbolos do Markdown e deixa só o texto. */
export const semMarkdown = (t: string) => t
  .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/^\s*(#{1,6}|[-*+](\s\[[ xX]\])?|\d+\.|>)\s+/gm, '')
  .replace(/[*_`~]/g, '');

export const DICA_MARKDOWN = 'Aceita Markdown: **negrito**, *itálico*, # título, - lista, - [ ] tarefa, [texto](link)';
