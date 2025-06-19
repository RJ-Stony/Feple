import { useState, useEffect } from "react";
import Papa from "papaparse";

export interface SessionRecord {
  session_id: string;
  asr_segments: Array<{ speaker: string; text: string }>;
  고객_sent_score: number;
  고객_sent_label: "긍정" | "중립" | "부정";
  상담사_sent_score: number;
  상담사_sent_label: "긍정" | "중립" | "부정";
  mid_category: string;
  content_category: string;
  top_nouns: string[];
  request_ratio: number;
  euphonious_word_ratio: number;
  positive_word_ratio: number;
  emo_1_star_score: number;
  honorific_ratio: number;
}

let sessionDataCache: SessionRecord[] | null = null;
let sessionDataPromise: Promise<SessionRecord[]> | null = null;

function parseSessions(): Promise<SessionRecord[]> {
  if (!sessionDataPromise) {
    sessionDataPromise = new Promise((resolve, reject) => {
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

      // public 폴더의 파일을 가리키는 경로
      const csvFilePath = "/data/text_features_all_training.csv";

      Papa.parse<RawCsvRecord>(csvFilePath, {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: ({ data }) => {
          try {
            const cleaned: SessionRecord[] = data.map((r) => {
              let rawSegments: any[] = [];
              if (typeof r.asr_segments === "string") {
                try {
                  const jsonString = r.asr_segments.replace(/'/g, '"');
                  rawSegments = JSON.parse(jsonString);
                } catch {
                  rawSegments = [];
                }
              }

              const nouns = r.top_nouns
                ? r.top_nouns.split(",").map((s) => s.trim())
                : [];
              const toLabel = (v: any) => {
                const s = String(v).trim();
                return s === "긍정" || s === "부정" ? s : "중립";
              };
              const toNumber = (v: number | string): number => {
                if (typeof v === "string") {
                  const n = parseFloat(v);
                  return isNaN(n) ? 0 : n;
                }
                return v ?? 0;
              };

              return {
                session_id: String(r.session_id),
                asr_segments: rawSegments,
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