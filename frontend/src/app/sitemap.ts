import type { MetadataRoute } from 'next'
import type { GuideContent, PaginatedResult } from '@/types'

const BASE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://drivertree.vercel.app').replace(
  /\/$/,
  '',
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let contentUrls: MetadataRoute.Sitemap = []

  try {
    const res = await fetch(`${BASE_API}/content?page=1&limit=200`)
    if (res.ok) {
      const data = (await res.json()) as PaginatedResult<GuideContent>
      contentUrls = data.data.map((item) => ({
        url: `${SITE_URL}/content/${item.slug}`,
        lastModified: new Date(item.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch {
    // 빌드 타임 API 미응답 시 정적 URL만 반환
  }

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...contentUrls,
  ]
}
