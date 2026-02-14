export type ValidationResult =
  | { ok: true }
  | { ok: false; code: ValidationCode; message: string };

export type ValidationCode =
  | "empty"
  | "min-length"
  | "url"
  | "ad"
  | "repeat"
  | "hangul-ratio-poor"
  | "vowel-poor";

interface ValidationOptions {
  minLength?: number;
  minLengthMessage?: string;
}

// Lightweight, local-only validation to catch noisy inputs without calling AI.
// This is intentionally heuristic and conservative to avoid blocking real content.
export function validateUserText(
  input: string,
  options?: ValidationOptions,
): ValidationResult {
  const text = input.trim();

  if (!text) {
    return { ok: false, code: "empty", message: "내용을 입력해주세요." };
  }

  if (options?.minLength && text.length < options.minLength) {
    return {
      ok: false,
      code: "min-length",
      message:
        options.minLengthMessage ?? `${options.minLength}자 이상 입력해주세요.`,
    };
  }

  // 1) URL or obvious link-like patterns are treated as advertising.
  if (hasUrl(text)) {
    return {
      ok: false,
      code: "url",
      message: "URL이 포함된 입력은 사용할 수 없습니다.",
    };
  }

  // 2) Ad-like keyword mix: contact/promo/CTA keywords appearing together.
  if (looksLikeAd(text)) {
    return {
      ok: false,
      code: "ad",
      message: "광고성 문구로 보이는 입력은 사용할 수 없습니다.",
    };
  }

  // 3) Repetitive noise: same token or character repeated too much.
  if (isRepetitive(text)) {
    return {
      ok: false,
      code: "repeat",
      message: "같은 단어/문자 반복이 많습니다. 입력을 확인해주세요.",
    };
  }

  // 4) If meaningful Hangul syllables are too few compared to total characters,
  // treat it as noisy/garbled input (e.g., lots of jamo / symbols).
  // - Default: at least 50% of counted characters should be Hangul syllables.
  // - Short inputs are exempt to reduce false positives.
  if (hasTooFewHangulSyllables(text, 0.5, 8)) {
    return {
      ok: false,
      code: "hangul-ratio-poor",
      message: "유의미한 한글입력이 너무 적습니다. 입력을 확인해주세요.",
    };
  }

  // 5) Excessively low vowel presence in Hangul jamo input.
  if (hasTooFewKoreanVowels(text)) {
    return {
      ok: false,
      code: "vowel-poor",
      message: "모음이 너무 적어 읽기 어려운 입력입니다.",
    };
  }

  return { ok: true };
}

function hasUrl(text: string) {
  const urlPattern =
    /https?:\/\/|www\.|\b[a-z0-9.-]+\.(?:com|net|org|kr|co|io|me|ly|app|link|site|shop|info|biz|tv)\b/i;
  return urlPattern.test(text);
}

function looksLikeAd(text: string) {
  // Promo/commerce cues.
  const promoKeywords = [
    "할인",
    "무료",
    "쿠폰",
    "이벤트",
    "구매",
    "판매",
    "홍보",
    "체험",
    "가격",
    "특가",
    "증정",
  ];

  // Contact or channel cues.
  const contactKeywords = [
    "카톡",
    "카카오톡",
    "오픈채팅",
    "텔레",
    "텔레그램",
    "DM",
    "인스타",
    "아이디",
    "문의",
    "상담",
    "채팅",
  ];

  // Call-to-action cues.
  const ctaKeywords = ["지금", "바로", "클릭", "참여", "신청", "입장", "링크"];

  const hasPhone = /\b0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}\b/.test(text);

  const promoCount = countKeywordHits(text, promoKeywords);
  const contactCount = countKeywordHits(text, contactKeywords);
  const ctaCount = countKeywordHits(text, ctaKeywords);

  const score = promoCount + contactCount + ctaCount + (hasPhone ? 2 : 0);
  const hasPromoOrContact = promoCount > 0 || contactCount > 0 || hasPhone;

  // Reduce false positives for diary-like content that mentions DM/Kakao/Instagram
  // without any promo/price/discount cues.
  if (promoCount === 0 && !hasPhone) {
    return contactCount >= 2 && ctaCount >= 2;
  }

  return score >= 3 && hasPromoOrContact;
}

function countKeywordHits(text: string, keywords: string[]) {
  let count = 0;
  for (const keyword of keywords) {
    if (text.includes(keyword)) count += 1;
  }
  return count;
}

function isRepetitive(text: string) {
  // Excessive same-character streaks (e.g., "ㅋㅋㅋㅋㅋ", "aaaaa").
  // - Matches any non-whitespace char repeated 5+ times consecutively.
  if (/([^\s])\1{4,}/.test(text)) return true;

  // Token-level repetition and low diversity.
  const tokens = text.match(/[A-Za-z0-9가-힣]+/g) ?? [];
  if (tokens.length < 3) return false;

  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  const uniqueRatio = counts.size / tokens.length;
  const maxRepeat = Math.max(...counts.values());
  const maxRepeatRatio = maxRepeat / tokens.length;

  if (uniqueRatio < 0.3 && tokens.length >= 4) return true;
  if (maxRepeatRatio >= 0.7 && tokens.length >= 3) return true;

  return false;
}

/**
 * Returns true when Hangul syllables ([가-힣]) are too few compared to the overall
 * "counted characters" (letters/digits/hangul syllables/jamo).
 *
 * Defaults:
 * - minRatio: 0.5 => need at least 50% syllables
 * - minCountedChars: 8 => exempt short inputs to avoid false positives
 *
 * Note:
 * - We intentionally exclude whitespace and punctuation from the denominator
 *   so users aren't penalized for spacing or punctuation.
 */
function hasTooFewHangulSyllables(
  text: string,
  minRatio = 0.5,
  minCountedChars = 8,
) {
  // Denominator: count only "content-ish" chars.
  // - Includes: A-Z / a-z / 0-9 / Hangul syllables / Hangul jamo
  // - Excludes: whitespace, punctuation, symbols, emoji
  const counted = (text.match(/[A-Za-z0-9가-힣ㄱ-ㅎㅏ-ㅣ]/g) ?? []).length;
  if (counted < minCountedChars) return false;

  const syllables = (text.match(/[가-힣]/g) ?? []).length;

  return syllables / counted < minRatio;
}

function hasTooFewKoreanVowels(text: string) {
  // Only check if input is mostly Korean jamo without full Hangul syllables.
  const hasSyllables = /[가-힣]/.test(text);
  const hasJamo = /[ㄱ-ㅎㅏ-ㅣ]/.test(text);
  if (hasSyllables || !hasJamo) return false;

  const consonants = (text.match(/[ㄱ-ㅎ]/g) ?? []).length;
  const vowels = (text.match(/[ㅏ-ㅣ]/g) ?? []).length;
  const total = consonants + vowels;
  if (total < 6) return false;

  return vowels / total < 0.2;
}
