import { test, expect } from '@playwright/test'
import { mockApiRoutes } from './fixtures'

test.beforeEach(async ({ page }) => {
  await mockApiRoutes(page)
})

test.describe('관리자 로그인 페이지', () => {
  test('페이지 로드 — 로그인 폼이 보인다', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.getByRole('heading', { name: 'DriveTree 백오피스' })).toBeVisible()
    await expect(page.getByLabel('관리자 계정 아이디')).toBeVisible()
    await expect(page.getByLabel('비밀번호')).toBeVisible()
    await expect(page.getByRole('button', { name: '백오피스 입장하기' })).toBeVisible()
  })

  test('홈으로 가기 링크가 "/" 경로를 가진다', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.getByRole('link', { name: '← DriveTree 홈으로' })).toHaveAttribute(
      'href',
      '/',
    )
  })

  test('빈 폼 제출 — HTML required 검증으로 제출이 막힌다', async ({ page }) => {
    await page.goto('/admin/login')
    // HTML5 required: 브라우저가 폼 제출을 막으므로 API 호출 없음
    let apiCalled = false
    await page.route('**/auth/login', () => {
      apiCalled = true
    })
    await page.getByRole('button', { name: '백오피스 입장하기' }).click()
    expect(apiCalled).toBe(false)
  })

  test('잘못된 자격증명 — 에러 메시지가 표시된다', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByLabel('관리자 계정 아이디').fill('wrong_user')
    await page.getByLabel('비밀번호').fill('wrong_password')
    await page.getByRole('button', { name: '백오피스 입장하기' }).click()
    await expect(page.getByText('올바르지 않습니다')).toBeVisible({ timeout: 5000 })
  })

  test('올바른 자격증명 — /admin/dashboard로 리다이렉트된다', async ({ page }) => {
    // dashboard API 모킹
    await page.route('http://localhost:4000/api/auth/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ userId: 'user-1', username: 'admin' }),
      })
    })
    await page.route('http://localhost:4000/api/content**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }),
      })
    })
    await page.route('http://localhost:4000/api/chat/logs**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }),
      })
    })

    await page.goto('/admin/login')
    await page.getByLabel('관리자 계정 아이디').fill('admin')
    await page.getByLabel('비밀번호').fill('any_password')
    await page.getByRole('button', { name: '백오피스 입장하기' }).click()
    await expect(page).toHaveURL('/admin/dashboard', { timeout: 5000 })
  })
})
