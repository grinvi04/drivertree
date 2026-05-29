import type { Page } from '@playwright/test';

export const MOCK_CONTENTS = [
  {
    id: 'content-1',
    title: '비보호 좌회전 완벽 가이드',
    slug: 'unprotected-left-turn',
    content: '비보호 좌회전은 신호등 없이 좌회전이 허용된 교차로에서 맞은편 직진 차량의 통행을 방해하지 않는 범위 내에서 좌회전할 수 있습니다.',
    category: 'rules',
    tags: ['좌회전', '교차로', '신호'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'content-2',
    title: '접촉사고 대처 방법',
    slug: 'accidents-crash-guide',
    content: '접촉사고 발생 시 먼저 안전한 곳으로 이동하고, 상대방과 연락처를 교환하세요.',
    category: 'accidents',
    tags: ['사고', '보험', '대처'],
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
];

export const MOCK_PAGINATED_CONTENTS = {
  data: MOCK_CONTENTS,
  meta: { total: 2, page: 1, limit: 12, totalPages: 1 },
};

export const MOCK_PENALTIES = [
  {
    id: 'penalty-1',
    name: '신호위반',
    category: '신호',
    fineNormal: 70000,
    fineChildZone: 130000,
    penaltyNormal: 60000,
    penaltyChildZone: 120000,
    pointsNormal: 15,
    pointsChildZone: 30,
    description: '신호를 위반하면 다른 차량과의 충돌 위험이 매우 높습니다.',
  },
  {
    id: 'penalty-2',
    name: '속도위반(20km/h 초과)',
    category: '속도',
    fineNormal: 60000,
    fineChildZone: 120000,
    penaltyNormal: 50000,
    penaltyChildZone: 100000,
    pointsNormal: 15,
    pointsChildZone: 30,
    description: '제한속도를 지켜야 안전합니다.',
  },
];

export const MOCK_MAINTENANCE_RESULT = {
  annual: { fuel: 2000000, tax: 400000, insurance: 1200000, maintenance: 600000, total: 4200000 },
  monthly: { fuel: 166667, tax: 33333, insurance: 100000, maintenance: 50000, total: 350000 },
  analysis: { fuelPercentage: 47.6, taxPercentage: 9.5, insurancePercentage: 28.6, maintenancePercentage: 14.3 },
};

export async function mockApiRoutes(page: Page) {
  const apiBase = 'http://localhost:4000/api';

  await page.route(`${apiBase}/content**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PAGINATED_CONTENTS),
    });
  });

  await page.route(`${apiBase}/calculator/penalties`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PENALTIES),
    });
  });

  await page.route(`${apiBase}/calculator/maintenance`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_MAINTENANCE_RESULT),
    });
  });

  await page.route(`${apiBase}/auth/login`, async (route) => {
    const body = route.request().postDataJSON() as { username: string };
    if (body?.username === 'admin') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'mock-token', username: 'admin' }),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' }),
      });
    }
  });
}
