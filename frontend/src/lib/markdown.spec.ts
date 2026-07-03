import { describe, it, expect } from 'vitest';
import { renderMarkdownSafe } from './markdown';

describe('renderMarkdownSafe', () => {
  it('**굵게**를 <strong>으로 렌더한다 (리터럴 ** 제거)', () => {
    const html = renderMarkdownSafe('이건 **굵게** 입니다');
    expect(html).toContain('<strong');
    expect(html).toContain('굵게');
    expect(html).not.toContain('**');
  });

  it('번호 목록(1. 2. 3.)을 <ol>/<li>로 렌더한다', () => {
    const html = renderMarkdownSafe('1. 첫째\n2. 둘째\n3. 셋째');
    expect(html).toContain('<ol');
    expect(html).toContain('<li');
    expect(html).toContain('첫째');
    expect(html).not.toContain('1. 첫째');
  });

  it('원시 HTML을 이스케이프해 실행 가능한 <script> 태그를 만들지 않는다', () => {
    const html = renderMarkdownSafe('<script>alert(1)</script> 안녕');
    // 입력 HTML은 텍스트로 이스케이프됨 — 실행 가능한 script 태그가 생성되지 않음
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('원시 <img onerror>를 실행 가능한 태그로 만들지 않는다', () => {
    const html = renderMarkdownSafe('<img src=x onerror="alert(1)">');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });
});
