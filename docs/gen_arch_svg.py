#!/usr/bin/env python3
"""
DriveTree architecture diagram generator (dark theme SVG).
Run: python3 docs/gen_arch_svg.py
Standards: team-harness/docs/architecture-diagram-standards.md
"""
# ─── Template primitives (copied from team-harness/templates/gen_arch_svg.py) ─
BG   = '#0f172a'
AREA = '#1e293b'
BW, BH, BR = 130, 80, 10

C = {
    'client':   {'s': '#94a3b8', 'f': '#1e293b', 't': '#e2e8f0'},
    'fe':       {'s': '#60a5fa', 'f': '#1e3a8a', 't': '#bfdbfe'},
    'proxy':    {'s': '#38bdf8', 'f': '#0c4a6e', 't': '#bae6fd'},
    'api':      {'s': '#4ade80', 'f': '#14532d', 't': '#bbf7d0'},
    'queue':    {'s': '#fb923c', 'f': '#7c2d12', 't': '#fed7aa'},
    'db':       {'s': '#34d399', 'f': '#065f46', 't': '#a7f3d0'},
    'dlq':      {'s': '#f87171', 'f': '#7f1d1d', 't': '#fecaca'},
    'auth':     {'s': '#c084fc', 'f': '#4a044e', 't': '#e9d5ff'},
    'edge':     {'s': '#818cf8', 'f': '#312e81', 't': '#c7d2fe'},
    'monitor':  {'s': '#818cf8', 'f': '#312e81', 't': '#c7d2fe'},
    'storage':  {'s': '#2dd4bf', 'f': '#134e4a', 't': '#99f6e4'},
    'external': {'s': '#fbbf24', 'f': '#78350f', 't': '#fde68a'},
    'ci':       {'s': '#a78bfa', 'f': '#3b0764', 't': '#ddd6fe'},
}

ARROW = '''<defs>
  <marker id="arr" markerWidth="9" markerHeight="7" refX="8.5" refY="3.5" orient="auto">
    <polygon points="0 0,9 3.5,0 7" fill="#94a3b8"/>
  </marker>
  <marker id="arr-dash" markerWidth="9" markerHeight="7" refX="8.5" refY="3.5" orient="auto">
    <polygon points="0 0,9 3.5,0 7" fill="#64748b"/>
  </marker>
</defs>'''


def box(cx, cy, ctype, title, sub):
    clr = C[ctype]
    x, y = cx - BW // 2, cy - BH // 2
    return (
        f'<rect x="{x}" y="{y}" width="{BW}" height="{BH}" rx="{BR}" '
        f'fill="{clr["f"]}" stroke="{clr["s"]}" stroke-width="2.5"/>'
        f'<text x="{cx}" y="{cy-8}" text-anchor="middle" '
        f'font-family="\'Segoe UI\',system-ui,sans-serif" font-size="14" '
        f'font-weight="700" fill="#f1f5f9">{title}</text>'
        f'<text x="{cx}" y="{cy+14}" text-anchor="middle" '
        f'font-family="\'Segoe UI\',system-ui,sans-serif" font-size="11" '
        f'fill="{clr["t"]}" opacity="0.9">{sub}</text>'
    )


def lbl(lx, ly, text):
    w = sum(14 if ord(c) > 127 else 8 for c in text) + 14
    return (
        f'<rect x="{lx - w // 2}" y="{ly - 13}" width="{w}" height="17" rx="3" '
        f'fill="#0f172a" opacity="0.92"/>'
        f'<text x="{lx}" y="{ly}" text-anchor="middle" '
        f'font-family="\'Segoe UI\',system-ui,sans-serif" '
        f'font-size="11" font-weight="600" fill="#e2e8f0">{text}</text>'
    )


def line(x1, y1, x2, y2, text='', dash=False, lx=None, ly=None):
    stroke = '#64748b' if dash else '#94a3b8'
    sw     = '1.5'    if dash else '2'
    d      = 'stroke-dasharray="6 3"' if dash else ''
    marker = 'url(#arr-dash)' if dash else 'url(#arr)'
    _lx    = lx if lx is not None else (x1 + x2) // 2
    _ly    = (ly if ly is not None else (y1 + y2) // 2) - 7
    return (
        f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
        f'stroke="{stroke}" stroke-width="{sw}" {d} marker-end="{marker}"/>'
        + (lbl(_lx, _ly, text) if text else '')
    )


def r(cx, cy): return cx + BW // 2, cy
def l(cx, cy): return cx - BW // 2, cy
def t(cx, cy): return cx, cy - BH // 2
def b(cx, cy): return cx, cy + BH // 2


def legend_row(items, y, W):
    total = sum(len(s) * 8 + 60 for _, s in items)
    x = (W - total) // 2
    parts = []
    for ctype, label in items:
        parts.append(
            f'<rect x="{x}" y="{y - 10}" width="12" height="12" rx="3" fill="{C[ctype]["s"]}"/>'
            f'<text x="{x + 17}" y="{y + 2}" '
            f'font-family="\'Segoe UI\',system-ui,sans-serif" font-size="11" fill="#94a3b8">{label}</text>'
        )
        x += len(label) * 8 + 60
    return ''.join(parts)


def wrap(W, H, title, subtitle, body, leg):
    return (
        f'<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">\n'
        f'  {ARROW}\n'
        f'  <rect width="{W}" height="{H}" fill="{BG}"/>\n'
        f'  <text x="48" y="42" font-family="\'Segoe UI\',system-ui,sans-serif" '
        f'font-size="20" font-weight="700" fill="#f1f5f9">{title}</text>\n'
        f'  <text x="48" y="62" font-family="\'Segoe UI\',system-ui,sans-serif" '
        f'font-size="12" fill="#64748b">{subtitle}</text>\n'
        f'  <rect x="28" y="72" width="{W - 56}" height="{H - 100}" rx="12" '
        f'fill="{AREA}" stroke="#334155" stroke-width="1"/>\n'
        f'{body}\n'
        f'{leg}\n'
        f'</svg>'
    )


# ─── DriveTree diagram ────────────────────────────────────────────────────────

def gen_architecture(out='docs/architecture.svg'):
    W, H = 1030, 430

    # Main row y=280, CI at top y=115
    N = {
        'client': (90,  280),
        'nextjs': (360, 280),
        'nestjs': (630, 280),
        'neon':   (900, 280),
        'ci':     (495, 115),
    }

    nodes = (
        box(*N['client'], 'client', '사용자',        'Browser')
        + box(*N['nextjs'],'fe',   'Next.js 16',     'SSG/ISR · CSR · Vercel')
        + box(*N['nestjs'],'api',  'NestJS 11',      'JWT Guard · Railway')
        + box(*N['neon'],  'db',   'Neon PostgreSQL', 'pgvector · 4개 테이블')
        + box(*N['ci'],    'ci',   'GitHub Actions',  'lint · build · test · deploy')
    )

    edges = (
        line(*r(*N['client']), *l(*N['nextjs']), 'HTTPS')
        + line(*r(*N['nextjs']),*l(*N['nestjs']), 'JWT Cookie')
        + line(*r(*N['nestjs']),*l(*N['neon']),   'pgvector')
        + line(*b(*N['ci']),   *t(*N['nextjs']),  'Vercel 배포', dash=True)
        + line(*b(*N['ci']),   *t(*N['nestjs']),  'Railway 배포', dash=True)
    )

    leg = legend_row([
        ('fe', 'Frontend (Vercel)'),
        ('api', 'Backend (Railway)'),
        ('db', 'Database (Neon)'),
        ('ci', 'CI/CD'),
    ], H - 30, W)

    svg = wrap(W, H,
               'DriveTree Architecture',
               'Next.js 16 · NestJS 11 · Neon PostgreSQL + pgvector · Vercel · Railway · GitHub Actions',
               nodes + edges, leg)

    with open(out, 'w') as f:
        f.write(svg)
    print(f'Written: {out}')


if __name__ == '__main__':
    import os
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    gen_architecture()
