import { useState, useEffect } from "react";
import Papa from "papaparse";
import rawData from "../data/dashboard/text_features_all_training.csv?raw";

export interface SessionRecord {
  session_id: string;

  // 대화 내용
  asr_segments: Array<{
    speaker: string;
    text: string;
  }>;

  // 감정 점수 & 레이블
  고객_sent_score: number;
  고객_sent_label: "긍정" | "중립" | "부정";
  상담사_sent_score: number;
  상담사_sent_label: "긍정" | "중립" | "부정";

  // 메타
  mid_category: string;
  content_category: string;
  top_nouns: string[];

  // — 공손화법·친절도 지표 —
  request_ratio: number; // 요청 화법 비율
  euphonious_word_ratio: number; // 완곡어 사용 비율
  positive_word_ratio: number; // 긍정 단어 비율
  emo_1_star_score: number; // 부정적 어휘 점수 (낮을수록 좋음)
  honorific_ratio: number; // 존댓말 사용 비율
}

// 모듈 레벨 캐시
let sessionDataCache: SessionRecord[] | null = null;
let sessionDataPromise: Promise<SessionRecord[]> | null = null;

function parseSessions(): Promise<SessionRecord[]> {
  if (!sessionDataPromise) {
    sessionDataPromise = new Promise((resolve, reject) => {
      // CSV에서 읽어오는 원시 레코드 타입
      interface RawCsvRecord {
        session_id: string;
        asr_segments: string | any[];
        top_nouns: string;
        고객_sent_score: number | string;
        고객_sent_label: string;
        상담사_sent_score: number | string;
        상담사_sent_label: string;
        mid_category: string;
        content_category: string;
        request_ratio: number | string;
        euphonious_word_ratio: number | string;
        positive_word_ratio: number | string;
        상담사_emo_1_star_score: number | string;
        honorific_ratio: number | string;
      }

      Papa.parse<RawCsvRecord>(rawData, {
        header: true,
        dynamicTyping: true,
        complete: ({ data }) => {
          try {
            const cleaned: SessionRecord[] = data.map((r) => {
              // 1) ASR 세그먼트 파싱
              let rawSegments: any[] = [];
              if (typeof r.asr_segments === "string") {
                try {
                  // eslint-disable-next-line no-eval
                  rawSegments = eval(r.asr_segments);
                } catch {
                  rawSegments = [];
                }
              } else {
                rawSegments = r.asr_segments;
              }
              const segments = rawSegments.map((seg) => ({
                speaker: seg.speaker,
                text: seg.text,
              }));

              // 2) 주요 명사 파싱
              const nouns = r.top_nouns
                ? r.top_nouns.split(",").map((s) => s.trim())
                : [];

              // 3) 레이블 강제 정제
              const toLabel = (v: any) => {
                const s = String(v).trim();
                return s === "긍정" || s === "부정" ? s : "중립";
              };

              // 4) 숫자 필드 안전 파싱
              const toNumber = (v: number | string): number => {
                if (typeof v === "string") {
                  const n = parseFloat(v);
                  return isNaN(n) ? 0 : n;
                }
                return v ?? 0;
              };

              return {
                session_id: String(r.session_id),
                asr_segments: segments,
                top_nouns: nouns,

                고객_sent_score: toNumber(r.고객_sent_score),
                고객_sent_label: toLabel(r.고객_sent_label),

                상담사_sent_score: toNumber(r.상담사_sent_score),
                상담사_sent_label: toLabel(r.상담사_sent_label),

                mid_category: r.mid_category || "",
                content_category: r.content_category || "",

                request_ratio: toNumber(r.request_ratio),
                euphonious_word_ratio: toNumber(r.euphonious_word_ratio),
                positive_word_ratio: toNumber(r.positive_word_ratio),

                // CSV 컬럼명이 '상담사_emo_1_star_score' 인 것을 매핑
                emo_1_star_score: toNumber(r["상담사_emo_1_star_score"]),

                honorific_ratio: toNumber(r.honorific_ratio),
              };
            });

            sessionDataCache = cleaned;
            resolve(cleaned);
          } catch (e) {
            reject(e);
          }
        },
        error: (err: any) => reject(err),
      });
    });
  }
  return sessionDataPromise!;
}

/**
 * React hook
 */
export function useSessionData() {
  const [sessions, setSessions] = useState<SessionRecord[]>(
    () => sessionDataCache || []
  );
  const [loading, setLoading] = useState<boolean>(
    () => sessionDataCache === null
  );

  useEffect(() => {
    if (sessionDataCache) return;

    parseSessions()
      .then((data) => {
        setSessions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("세션 데이터 로드 실패", err);
        setSessions([]);
        setLoading(false);
      });
  }, []);

  return { loading, sessions };
}
