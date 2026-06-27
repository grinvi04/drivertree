/**
 * API Key 없이도 한국어 자연어 검색 및 유사도 매칭을 가능하게 하는
 * 초경량 로컬 NLP / TF-IDF 기반 코사인 유사도 헬퍼 함수
 */

// 제거할 한국어 조사 및 불용어 리스트
const STOPWORDS = new Set([
  '은',
  '는',
  '이',
  '가',
  '을',
  '를',
  '에',
  '의',
  '로',
  '으로',
  '와',
  '과',
  '하고',
  '에서',
  '에게',
  '한테',
  '까지',
  '부터',
  '요',
  '다',
  '습니다',
  '니다',
  '어',
  '아',
  '게',
  '고',
  '면',
  '해서',
])

/**
 * 텍스트에서 의미 있는 단어(명사/핵심어) 토큰을 추출하고 정형화합니다.
 */
export function tokenize(text: string): string[] {
  if (!text) return []

  // 소문자 변환 및 한글/영어/숫자를 제외한 특수문자 제거
  const cleaned = text.toLowerCase().replace(/[^a-zA-Z0-9가-힣\s]/g, ' ')

  // 공백 기준 분리
  const words = cleaned.split(/\s+/).filter(Boolean)

  const tokens: string[] = []

  for (const word of words) {
    // 단어 길이가 1이면 무시 (예: '의', '에')
    if (word.length <= 1) continue

    // 한국어 조사를 단순 매칭하여 제거하는 형태의 Stemming
    let stemmed = word
    for (const stop of STOPWORDS) {
      if (word.endsWith(stop) && word.length > stop.length) {
        stemmed = word.substring(0, word.length - stop.length)
        break
      }
    }

    if (stemmed.length > 1) {
      tokens.push(stemmed)
    } else {
      tokens.push(word) // 원래 단어가 짧으면 그냥 유지
    }
  }

  return tokens
}

/**
 * 토큰 배열로부터 빈도수 맵(Term Frequency)을 빌드합니다.
 */
export function getTermFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>()
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1)
  }
  return tf
}

/**
 * 두 빈도수 맵 간의 코사인 유사도를 계산합니다.
 */
export function calculateCosineSimilarity(
  tf1: Map<string, number>,
  tf2: Map<string, number>,
): number {
  const allTerms = new Set([...tf1.keys(), ...tf2.keys()])

  let dotProduct = 0
  let magnitude1 = 0
  let magnitude2 = 0

  for (const term of allTerms) {
    const val1 = tf1.get(term) || 0
    const val2 = tf2.get(term) || 0

    dotProduct += val1 * val2
    magnitude1 += val1 * val1
    magnitude2 += val2 * val2
  }

  if (magnitude1 === 0 || magnitude2 === 0) return 0

  return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2))
}

/**
 * 사용자의 질문(Query)과 여러 가이드 포스트(Contents)들 사이의 유사도를 계산하여
 * 가장 유사한 상위 포스트들을 정렬해 반환합니다.
 */
export function rankContents(
  query: string,
  contents: { id: string; title: string; content: string; slug?: string }[],
  limit = 3,
) {
  const queryTokens = tokenize(query)
  const queryTf = getTermFrequency(queryTokens)

  const scored = contents.map((post) => {
    // 제목과 본문을 결합하여 토큰 분석 (제목에 가중치 2배 부여)
    const titleTokens = tokenize(post.title)
    const contentTokens = tokenize(post.content)

    const combinedTokens = [...titleTokens, ...titleTokens, ...contentTokens]
    const postTf = getTermFrequency(combinedTokens)

    const score = calculateCosineSimilarity(queryTf, postTf)

    return {
      post,
      score,
    }
  })

  // 유사도가 높은 순으로 정렬하고 임계치(0.05) 이상인 것만 필터링
  return scored
    .filter((item) => item.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.post)
}
