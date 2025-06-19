import { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";

export interface RecordType {
  session_id: string;
  speech_count: number;
  silence_ratio?: number;
  speed_ratio?: number;
  고객_sent_score: number;
  script_phrase_ratio: number;
  conflict_flag: number;
  empathy_ratio: number;
  mid_category: string;
  content_category: string;
  top_nouns: string;
  session_date: string;
  honorific_ratio?: number;
}

export interface KPIType {
  label: string;
  value: string;
}

export interface PieDatum {
  name: string;
  value: number;
}

export interface TopNoun {
  word: string;
  count: number;
}

export function useDashboardData() {
  const [data, setData] = useState<RecordType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const csvFilePath = "/data/text_features_all_training_ver2.csv";

    Papa.parse<RecordType>(csvFilePath, {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: ({ data: parsed }) => {
        setData(parsed);
        setLoading(false);
      },
      error: (err) => {
        console.error("CSV 파싱 에러:", err);
        setLoading(false);
      },
    });
  }, []);

  const total = useMemo(() => data.length, [data]);

  const avgSent = useMemo(
    () =>
      total ? data.reduce((s, r) => s + r.고객_sent_score, 0) / total : NaN,
    [data, total]
  );

  const avgScript = useMemo(
    () =>
      total ? data.reduce((s, r) => s + r.script_phrase_ratio, 0) / total : NaN,
    [data, total]
  );

  const conflictRate = useMemo(
    () =>
      total
        ? (data.reduce((s, r) => s + r.conflict_flag, 0) / total) * 100
        : NaN,
    [data, total]
  );

  const avgEmpathy = useMemo(
    () => (total ? data.reduce((s, r) => s + r.empathy_ratio, 0) / total : NaN),
    [data, total]
  );

  const avgSilence = useMemo(
    () =>
      total
        ? data.reduce((s, r) => s + (r.silence_ratio ?? 0), 0) / total
        : NaN,
    [data, total]
  );

  const avgSpeed = useMemo(
    () =>
      total ? data.reduce((s, r) => s + (r.speed_ratio ?? 0), 0) / total : NaN,
    [data, total]
  );

  const avgHonorific = useMemo(
    () =>
      total
        ? data.reduce((s, r) => s + (r.honorific_ratio ?? 0), 0) / total
        : NaN,
    [data, total]
  );

  const kpi: KPIType[] = useMemo(
    () => [
        {
            label: "현재까지 진행된 상담은",
            value: total
            ? `${total}건이에요`
            : "아직 대시보드에 표시할 상담이 없어요",
        },
        {
            label: "상담사님의 평균 감정 점수는",
            value: !isNaN(avgSent)
            ? `${avgSent.toFixed(2)} / 5점이에요`
            : "아직 계산할 데이터가 없어요",
        },
        {
            label: "스크립트를 지켜서 말한 비율은",
            value: !isNaN(avgScript)
            ? `${(avgScript * 100).toFixed(1)}%입니다`
            : "아직 계산할 데이터가 없어요",
        },
        {
            label: "고객님과의 갈등 비율은",
            value: !isNaN(conflictRate)
            ? `${conflictRate.toFixed(1)}%네요`
            : "아직 계산할 데이터가 없어요",
        },
        {
            label: "상담사님의 존댓말 사용 비율은",
            value: !isNaN(avgHonorific)
            ? `${(avgHonorific * 100).toFixed(1)}%이고,`
            : "아직 계산할 데이터가 없어요",
        },
        {
            label: "상담사님의 공감 표현 비율은",
            value: !isNaN(avgEmpathy)
            ? `${(avgEmpathy * 100).toFixed(1)}%나 하셨네요!`
            : "아직 계산할 데이터가 없어요",
        },
        {
            label: "상담사님의 평균 침묵 비율은",
            value: !isNaN(avgSilence)
            ? `${(avgSilence * 100).toFixed(1)}%이에요`
            : "아직 데이터가 없어요",
        },
        {
            label: "상담사님의 평균 발화 속도는",
            value: !isNaN(avgSpeed)
            ? `${avgSpeed.toFixed(2)} WPM이에요`
            : "아직 데이터가 없어요",
        },
    ],
    [
      total,
      avgSent,
      avgScript,
      conflictRate,
      avgEmpathy,
      avgSilence,
      avgSpeed,
      avgHonorific,
    ]
  );

  const midData: PieDatum[] = useMemo(() => {
    const cnt: Record<string, number> = {};
    data.forEach((r) => {
      if (r.mid_category) { // 안전장치 추가
        cnt[r.mid_category] = (cnt[r.mid_category] || 0) + 1;
      }
    });
    return Object.entries(cnt)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 100);
  }, [data]);

  const contentData: PieDatum[] = useMemo(() => {
    const cnt: Record<string, number> = {};
    data.forEach((r) => {
      if (r.content_category) { // 안전장치 추가
        cnt[r.content_category] = (cnt[r.content_category] || 0) + 1;
      }
    });
    return Object.entries(cnt)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 100);
  }, [data]);

  const topNouns: TopNoun[] = useMemo(() => {
    const cnt: Record<string, number> = {};
    data.forEach((r) => {
      // top_nouns가 비어있지 않은 문자열일 때만 실행하도록 수정
      if (r.top_nouns && typeof r.top_nouns === 'string') {
        r.top_nouns.split(",").forEach((n) => {
          const w = n.trim();
          if (w.length > 1 && w !== "금제" && w !== "지금") {
            cnt[w] = (cnt[w] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(cnt)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, count]) => ({ word, count }));
  }, [data]);

  return { loading, kpi, midData, contentData, topNouns };
}