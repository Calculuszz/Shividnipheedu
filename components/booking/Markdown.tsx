import type { ReactNode } from 'react';

// Tiny Markdown renderer for the text staff keep in the database
// (details_md, rules_md, health_notice). Builds React elements directly, so
// nothing in the text can inject HTML or scripts.
// Supports: ## headings, paragraphs, - / * / 1. lists, **bold**, *italic* / _italic_,
// `code`, [link](https://…) and line breaks.

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${keyBase}-${i++}`;
    if (m[2]) out.push(<strong key={k}>{m[2]}</strong>);
    else if (m[3] || m[4]) out.push(<em key={k}>{m[3] || m[4]}</em>);
    else if (m[5]) out.push(<code key={k} className="px-1 rounded bg-halloween-dark/60">{m[5]}</code>);
    else if (m[6]) out.push(<a key={k} href={m[7]} target="_blank" rel="noopener noreferrer" className="underline">{m[6]}</a>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Markdown({ text, className = '' }: { text: string | null | undefined; className?: string }) {
  if (!text?.trim()) return null;

  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const size = heading[1].length === 1 ? 'text-xl' : heading[1].length === 2 ? 'text-lg' : 'text-base';
      blocks.push(<p key={i} className={`${size} font-bold text-halloween-orange`}>{inline(heading[2], `h${i}`)}</p>);
      i++;
      continue;
    }

    const ordered = /^\s*\d+[.)]\s+/;
    const bullet = /^\s*[-*]\s+/;
    if (ordered.test(line) || bullet.test(line)) {
      const isOrdered = ordered.test(line);
      const pattern = isOrdered ? ordered : bullet;
      const items: ReactNode[] = [];
      while (i < lines.length && pattern.test(lines[i])) {
        items.push(<li key={i}>{inline(lines[i].replace(pattern, ''), `li${i}`)}</li>);
        i++;
      }
      const List = isOrdered ? 'ol' : 'ul';
      blocks.push(
        <List key={`l${i}`} className={`pd-list flex flex-col gap-1.5 pl-5 ${isOrdered ? 'list-decimal' : 'list-disc'} marker:text-halloween-orange marker:font-bold`}>
          {items}
        </List>
      );
      continue;
    }

    // Paragraph: consecutive plain lines, joined with line breaks
    const para: ReactNode[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|\s*[-*]\s|\s*\d+[.)]\s)/.test(lines[i])) {
      if (para.length) para.push(<br key={`br${i}`} />);
      para.push(...inline(lines[i], `p${i}`));
      i++;
    }
    blocks.push(<p key={`p${i}`}>{para}</p>);
  }

  return <div className={`flex flex-col gap-3 text-[15px] leading-relaxed ${className}`}>{blocks}</div>;
}
