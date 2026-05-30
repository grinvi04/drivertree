// README용 스크린샷 캡처 스크립트 (프로덕션 기준)
const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'https://drivertree.vercel.app';
const OUT_DIR = path.join(__dirname, '../docs/screenshots');

async function capture() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  // 1. 메인 페이지
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT_DIR}/01-main.png`, fullPage: false });
  console.log('✅ 01-main.png');

  // 2. 챗봇 데모
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.click('button[aria-label="AI 챗봇 열기"]');
  await page.waitForSelector('#chat-input', { state: 'visible' });
  await page.fill('#chat-input', '비보호좌회전 언제 할 수 있어?');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${OUT_DIR}/02-chatbot.png`, fullPage: false });
  console.log('✅ 02-chatbot.png');

  // 3. 관리자 대시보드
  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.fill('#admin-username', 'admin');
  await page.fill('#admin-password', process.env.ADMIN_PASSWORD || '');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT_DIR}/03-admin.png`, fullPage: false });
  console.log('✅ 03-admin.png');

  await browser.close();
  console.log('\n완료. docs/screenshots/ 확인');
}

capture().catch((e) => { console.error(e); process.exit(1); });
