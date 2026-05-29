import { test, expect } from '@playwright/test';
import { mockApiRoutes, MOCK_CONTENTS } from './fixtures';

test.beforeEach(async ({ page }) => {
  await mockApiRoutes(page);
});

test.describe('홈 페이지', () => {
  test('페이지 로드 — 히어로 제목과 검색바가 보인다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('막막한 순간');
    await expect(page.getByRole('textbox', { name: '가이드 검색' })).toBeVisible();
    await expect(page.getByRole('button', { name: '가이드 검색하기' })).toBeVisible();
  });

  test('가이드 카드가 API 데이터로 렌더링된다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('article').first()).toBeVisible();
    await expect(page.getByText(MOCK_CONTENTS[0].title)).toBeVisible();
    await expect(page.getByText(MOCK_CONTENTS[1].title)).toBeVisible();
  });

  test('카테고리 탭 — 클릭 시 aria-pressed가 토글된다', async ({ page }) => {
    await page.goto('/');
    const rulesBtn = page.getByRole('button', { name: '도로 법규 · 신호 카테고리 선택' });
    await expect(rulesBtn).toHaveAttribute('aria-pressed', 'false');
    await rulesBtn.click();
    await expect(rulesBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('검색바에 쿼리 입력 후 제출하면 API가 재호출된다', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/content')) requests.push(req.url());
    });

    await page.goto('/');
    await page.getByRole('textbox', { name: '가이드 검색' }).fill('비보호 좌회전');
    await page.getByRole('button', { name: '가이드 검색하기' }).click();
    // 검색 파라미터가 포함된 요청이 발생했는지 확인
    await page.waitForTimeout(300);
    expect(requests.some((u) => u.includes('search='))).toBe(true);
  });

  test('인기 검색어 클릭 시 검색이 실행된다', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '비보호 좌회전 검색하기' }).click();
    await expect(page.getByRole('textbox', { name: '가이드 검색' })).toHaveValue('비보호 좌회전');
  });

  test('가이드 카드의 "자세히 보기" 링크가 올바른 경로를 가진다', async ({ page }) => {
    await page.goto('/');
    const link = page.getByRole('link', { name: '자세히 보기' }).first();
    await expect(link).toHaveAttribute('href', `/content/${MOCK_CONTENTS[0].slug}`);
  });

  test('AI 챗봇 버튼이 렌더링된다', async ({ page }) => {
    await page.goto('/');
    // ChatbotWidget의 토글 버튼
    const chatBtn = page.getByRole('button', { name: /AI 챗봇|채팅|chat/i });
    await expect(chatBtn.first()).toBeVisible();
  });
});
