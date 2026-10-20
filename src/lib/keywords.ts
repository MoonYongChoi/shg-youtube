const STOPWORDS = new Set([
  "그리고", "그래서", "하지만", "그런데", "근데", "저는", "제가", "너무", "정말", "진짜", "그냥",
  "이거", "저거", "그거", "이게", "저게", "그게", "입니다", "있습니다", "같습니다", "했습니다",
  "습니다", "해요", "예요", "이에요", "네요", "구요", "거예요", "같아요", "그", "이", "저", "것",
  "수", "등", "좀", "더", "또", "잘", "안", "못", "다", "때", "건", "게", "거", "좋은", "좋습니다",
  "있는", "하는", "할", "한", "이런", "저런", "그런", "어떤", "혹시", "그냥", "진짜로", "너무나",
]);

// 길이가 긴 조사/어미부터 먼저 검사해야 짧은 조사가 먼저 잘못 걸리는 걸 방지
const PARTICLE_SUFFIXES = [
  "으로써", "으로서", "이라서", "이라고", "에서는", "에게는", "한테는", "이라면", "한다면",
  "에서", "에게", "한테", "부터", "까지", "보다", "처럼", "마저", "조차", "밖에",
  "이나", "나마", "야말로", "이라도", "라도", "이라", "라서", "이고",
  "으로", "로", "에", "의", "은", "는", "이", "가", "을", "를", "과", "와", "도", "만", "들", "께", "님",
];

function stripParticle(token: string): string {
  for (const suf of PARTICLE_SUFFIXES) {
    if (token.length > suf.length + 1 && token.endsWith(suf)) {
      return token.slice(0, -suf.length);
    }
  }
  return token;
}

export interface KeywordCount {
  word: string;
  count: number;
}

/**
 * 한국어 형태소 분석기 없이 간단한 휴리스틱(공백/문장부호 분리 + 흔한 조사 제거 + 불용어 필터)으로
 * 단어 빈도를 센다. 정확한 형태소 분석은 아니지만 참고용 키워드 랭킹으로는 충분하다.
 * 댓글 전체를 다시 훑는 무거운 작업이라 결과는 캐싱해서 쓰고(src/lib/keywordCache.ts), 여기서는
 * 전체 빈도표만 만든다 — 제외 키워드 적용/상위 N개 추리기는 rankKeywords에서 가볍게 처리한다.
 */
export function computeWordFrequencies(texts: string[]): Record<string, number> {
  const freq: Record<string, number> = {};
  const urlRe = /https?:\/\/\S+/g;
  const nonWordRe = /[^\p{L}\p{N}]+/gu;

  for (const text of texts) {
    const cleaned = text.replace(urlRe, " ");
    const rawTokens = cleaned.split(nonWordRe).filter(Boolean);
    for (const raw of rawTokens) {
      if (/^\d+$/.test(raw)) continue;
      const stripped = stripParticle(raw);
      if (stripped.length < 2) continue;
      if (STOPWORDS.has(stripped)) continue;
      freq[stripped] = (freq[stripped] ?? 0) + 1;
    }
  }

  return freq;
}

export function rankKeywords(
  frequencies: Record<string, number>,
  excludeWords: Set<string>,
  topN = 50,
): KeywordCount[] {
  return Object.entries(frequencies)
    .filter(([word]) => !excludeWords.has(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }));
}
