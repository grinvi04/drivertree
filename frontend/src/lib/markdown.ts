import sanitizeHtml from 'sanitize-html';

// 콘텐츠 상세 페이지와 챗봇 말풍선이 공유하는 마크다운 렌더러.
// 렌더링 후 반드시 sanitize 하여 XSS를 방어한다.

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const BODY_STYLE = 'font-size:17px;line-height:1.75;letter-spacing:-0.3px;color:#1d1d1f;';
const BODY_P = `${BODY_STYLE}margin:0 0 20px;`;

function parseInlineMarkdown(text: string): string {
  let parsed = escapeHtml(text);
  parsed = parsed.replace(
    /\*\*(.*?)\*\*/g,
    '<strong style="font-weight:700;color:#1d1d1f">$1</strong>',
  );
  parsed = parsed.replace(
    /`(.*?)`/g,
    '<code style="background:#f0f0f2;border:1px solid #d8d8dc;color:#1d1d1f;padding:2px 6px;border-radius:4px;font-size:14px;font-family:ui-monospace,monospace">$1</code>',
  );
  return parsed;
}

const CALLOUT_META: Record<string, { icon: string; label: string; bg: string; border: string; labelColor: string }> = {
  TIP:       { icon: '💡', label: '팁',  bg: '#f0faf4', border: '#34c759', labelColor: '#1a7f37' },
  NOTE:      { icon: '📝', label: '노트', bg: '#f5f8ff', border: '#0066cc', labelColor: '#0066cc' },
  WARNING:   { icon: '⚠️', label: '주의', bg: '#fff8f0', border: '#ff9500', labelColor: '#b45309' },
  CAUTION:   { icon: '🚨', label: '경고', bg: '#fff5f5', border: '#ff3b30', labelColor: '#c9362d' },
  IMPORTANT: { icon: '❗', label: '중요', bg: '#f8f5ff', border: '#5856d6', labelColor: '#5856d6' },
};

function renderCallout(type: string, contentLines: string[]): string {
  const meta = CALLOUT_META[type] ?? CALLOUT_META['NOTE'];
  const inner: string[] = [];
  let inList = false;
  for (const line of contentLines) {
    if (/^[-*]\s/.test(line)) {
      if (!inList) { inner.push('<ul style="margin:8px 0 4px 18px;padding:0;list-style:disc">'); inList = true; }
      inner.push(`<li style="font-size:15px;line-height:1.65;color:#1d1d1f;margin-bottom:4px">${parseInlineMarkdown(line.replace(/^[-*]\s/, ''))}</li>`);
    } else {
      if (inList) { inner.push('</ul>'); inList = false; }
      if (line.trim()) inner.push(`<p style="font-size:15px;line-height:1.65;color:#1d1d1f;margin:0 0 4px">${parseInlineMarkdown(line)}</p>`);
    }
  }
  if (inList) inner.push('</ul>');
  return `<div style="border-left:4px solid ${meta.border};background:${meta.bg};border-radius:0 10px 10px 0;padding:14px 18px;margin:24px 0">` +
    `<p style="font-size:13px;font-weight:700;color:${meta.labelColor};margin:0 0 8px;letter-spacing:-0.12px">${meta.icon} ${meta.label}</p>` +
    inner.join('') +
    `</div>`;
}

function renderTable(lines: string[]): string {
  const isSep = (l: string) => /^\|[\s\-:|]+\|/.test(l.trim());
  const parseRow = (l: string) => l.split('|').slice(1, -1).map(c => c.trim());

  const headerLine = lines[0];
  const dataLines = lines.slice(1).filter(l => !isSep(l));
  const headers = parseRow(headerLine);

  const TH = 'padding:10px 14px;text-align:left;font-size:14px;font-weight:700;color:#1d1d1f;background:#f5f5f7;border-bottom:2px solid #e0e0e0;white-space:nowrap;letter-spacing:-0.224px';
  const TD = 'padding:10px 14px;font-size:14px;color:#1d1d1f;border-bottom:1px solid #e8e8e8;line-height:1.6;letter-spacing:-0.224px;vertical-align:middle';

  let html = '<div style="overflow-x:auto;margin:0 0 24px;border-radius:10px;border:1px solid #e0e0e0"><table style="width:100%;border-collapse:collapse">';
  html += '<thead><tr>' + headers.map(h => `<th style="${TH}">${parseInlineMarkdown(h)}</th>`).join('') + '</tr></thead>';
  html += '<tbody>' + dataLines.map((row, ri) => {
    const bg = ri % 2 === 1 ? 'background:#fafafa;' : '';
    return '<tr>' + parseRow(row).map(c => `<td style="${TD}${bg}">${parseInlineMarkdown(c)}</td>`).join('') + '</tr>';
  }).join('') + '</tbody>';
  html += '</table></div>';
  return html;
}

export function renderMarkdown(md: string): string {
  if (!md) return '';

  const lines = md.split('\n');
  const out: string[] = [];
  let inUl = false;
  let inOl = false;
  let i = 0;

  const closeList = () => {
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  };

  while (i < lines.length) {
    const line = lines[i];

    // Table block
    if (/^\s*\|/.test(line)) {
      closeList();
      const block: string[] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { block.push(lines[i]); i++; }
      out.push(renderTable(block));
      continue;
    }

    // Callout block: > [!TYPE]
    const calloutMatch = /^>\s*\[!(TIP|WARNING|NOTE|CAUTION|IMPORTANT)\]/.exec(line);
    if (calloutMatch) {
      closeList();
      const type = calloutMatch[1];
      const content: string[] = [];
      i++;
      while (i < lines.length && /^>/.test(lines[i])) {
        content.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push(renderCallout(type, content));
      continue;
    }

    // Unordered list
    const ulMatch = /^[\s]*[-*]\s+(.*)$/.exec(line);
    if (ulMatch) {
      if (inOl) closeList();
      if (!inUl) { out.push('<ul style="margin:0 0 20px 24px;padding:0;list-style:disc">'); inUl = true; }
      out.push(`<li style="${BODY_STYLE}margin-bottom:10px">${parseInlineMarkdown(ulMatch[1])}</li>`);
      i++; continue;
    }

    // Ordered list
    const olMatch = /^[\s]*\d+\.\s+(.*)$/.exec(line);
    if (olMatch) {
      if (inUl) closeList();
      if (!inOl) { out.push('<ol style="margin:0 0 20px 24px;padding:0;list-style:decimal">'); inOl = true; }
      out.push(`<li style="${BODY_STYLE}margin-bottom:10px">${parseInlineMarkdown(olMatch[1])}</li>`);
      i++; continue;
    }

    closeList();

    if (line.startsWith('### ')) {
      out.push(`<h4 style="font-size:17px;font-weight:700;color:#1d1d1f;margin:32px 0 12px;letter-spacing:-0.374px">${parseInlineMarkdown(line.substring(4))}</h4>`);
    } else if (line.startsWith('## ')) {
      out.push(`<h3 style="font-size:22px;font-weight:700;color:#1d1d1f;margin:40px 0 16px;letter-spacing:-0.01em;border-bottom:2px solid #f0f0f2;padding-bottom:10px">${parseInlineMarkdown(line.substring(3))}</h3>`);
    } else if (line.startsWith('# ')) {
      out.push(`<h2 style="font-size:28px;font-weight:700;color:#1d1d1f;margin:48px 0 20px;letter-spacing:-0.01em">${parseInlineMarkdown(line.substring(2))}</h2>`);
    } else if (/^>\s/.test(line)) {
      out.push(`<blockquote style="border-left:4px solid #0066cc;background:#f5f8ff;padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;${BODY_STYLE}margin-bottom:20px">${parseInlineMarkdown(line.substring(2))}</blockquote>`);
    } else if (line.trim() !== '') {
      out.push(`<p style="${BODY_P}">${parseInlineMarkdown(line)}</p>`);
    }

    i++;
  }

  closeList();
  return out.join('');
}

// 마크다운을 렌더한 뒤 sanitize 하여 안전한 HTML 문자열을 반환한다.
export function renderMarkdownSafe(md: string): string {
  return sanitizeHtml(renderMarkdown(md), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h2', 'h3', 'h4', 'del']),
    allowedAttributes: { '*': ['style'] },
  });
}
