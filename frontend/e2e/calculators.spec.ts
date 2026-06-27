import { test, expect } from '@playwright/test'
import { mockApiRoutes, MOCK_PENALTIES, MOCK_MAINTENANCE_RESULT } from './fixtures'

test.beforeEach(async ({ page }) => {
  await mockApiRoutes(page)
})

test.describe('계산기 페이지', () => {
  test('페이지 로드 — 제목과 탭 2개가 보인다', async ({ page }) => {
    await page.goto('/calculators')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('스마트 계산기')
    await expect(page.getByRole('tab', { name: /범칙금/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: /유지비/ })).toBeVisible()
  })

  test.describe('범칙금 계산기', () => {
    test('기본 탭이 범칙금이고 위반 항목 select가 보인다', async ({ page }) => {
      await page.goto('/calculators')
      await expect(page.getByRole('tab', { name: /범칙금/ })).toHaveAttribute(
        'aria-selected',
        'true',
      )
      await expect(page.getByLabel('위반 항목')).toBeVisible()
    })

    test('API에서 받은 위반 항목이 select에 렌더링된다', async ({ page }) => {
      await page.goto('/calculators')
      const select = page.getByLabel('위반 항목')
      await expect(select.getByRole('option', { name: MOCK_PENALTIES[0].name })).toBeAttached()
      await expect(select.getByRole('option', { name: MOCK_PENALTIES[1].name })).toBeAttached()
    })

    test('어린이보호구역 토글 — 클릭 시 aria-checked가 변경된다', async ({ page }) => {
      await page.goto('/calculators')
      const toggle = page.getByRole('switch', { name: '어린이 보호구역 단속 여부 토글' })
      await expect(toggle).toHaveAttribute('aria-checked', 'false')
      await toggle.click()
      await expect(toggle).toHaveAttribute('aria-checked', 'true')
    })

    test('어린이보호구역 활성화 시 과태료 금액이 증가한다', async ({ page }) => {
      await page.goto('/calculators')
      // 일반 과태료 확인
      const normalFine = MOCK_PENALTIES[0].fineNormal.toLocaleString()
      await expect(page.getByText(`${normalFine}원`)).toBeVisible()

      // 어린이보호구역 활성화
      await page.getByRole('switch', { name: '어린이 보호구역 단속 여부 토글' }).click()
      const childFine = MOCK_PENALTIES[0].fineChildZone.toLocaleString()
      await expect(page.getByText(`${childFine}원`)).toBeVisible()
    })
  })

  test.describe('유지비 계산기', () => {
    test('탭 전환 시 유지비 폼이 보인다', async ({ page }) => {
      await page.goto('/calculators')
      await page.getByRole('tab', { name: /유지비/ }).click()
      await expect(page.getByRole('tab', { name: /유지비/ })).toHaveAttribute(
        'aria-selected',
        'true',
      )
      await expect(page.getByLabel('차종')).toBeVisible()
      await expect(page.getByLabel('연료 종류')).toBeVisible()
      await expect(page.getByRole('button', { name: '유지비 연산하기' })).toBeVisible()
    })

    test('"유지비 연산하기" 클릭 시 API를 호출하고 결과가 렌더링된다', async ({ page }) => {
      await page.goto('/calculators')
      await page.getByRole('tab', { name: /유지비/ }).click()
      await page.getByRole('button', { name: '유지비 연산하기' }).click()

      const expectedMonthly = MOCK_MAINTENANCE_RESULT.monthly.total.toLocaleString()
      await expect(page.getByText(`${expectedMonthly}원`)).toBeVisible({ timeout: 5000 })
    })

    test('차종을 경차로 변경해도 계산이 작동한다', async ({ page }) => {
      await page.goto('/calculators')
      await page.getByRole('tab', { name: /유지비/ }).click()
      await page.getByLabel('차종').selectOption('compact')
      await page.getByRole('button', { name: '유지비 연산하기' }).click()
      const expectedMonthly = MOCK_MAINTENANCE_RESULT.monthly.total.toLocaleString()
      await expect(page.getByText(`${expectedMonthly}원`)).toBeVisible({ timeout: 5000 })
    })
  })
})
