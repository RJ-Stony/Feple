import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import { ArrowUpTrayIcon, DocumentIcon } from "@heroicons/react/24/outline";
import { ResultsDisplay } from "../components/ResultsDisplay";

const pageVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ease: "easeOut", duration: 0.5 },
  },
};

// API 응답 결과의 타입을 정의
interface AnalysisResult {
  metrics: { [key: string]: number | string };
  transcript: { speaker: 'Agent' | 'Customer'; text: string; start_time: number; end_time: number }[];
}

// Replicate의 Prediction 객체 타입을 정의
interface Prediction {
    id: string;
    status: 'starting' | 'processing' | 'succeeded' | 'failed';
    output: AnalysisResult;
    error: string | null;
    urls: {
        get: string;
        cancel: string;
    };
}

// 실패 시 API 응답 타입을 정의
interface ErrorResponse {
    detail: string;
}

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("분석 시작");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setAnalysisResult(null);
      setError(null);
    }
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsLoading(true);
    setLoadingStatus("분석 시작 요청 중...");
    setError(null);
    setAnalysisResult(null);

    try {
      // 1. 분석 시작 요청 (접수증 받기)
      const startResponse = await fetch("/api/predictions", {
        method: "POST",
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });
      
      // --- 타입 에러 해결을 위한 수정 ---
      if (!startResponse.ok) {
        const errorData: ErrorResponse = await startResponse.json();
        throw new Error(errorData.detail || "분석 시작에 실패했습니다.");
      }

      let prediction: Prediction = await startResponse.json();
      // --------------------------------

      // 2. 상태 확인 (폴링) 시작
      setLoadingStatus("AI 모델이 분석 중입니다...");
      while (
        prediction.status !== "succeeded" &&
        prediction.status !== "failed"
      ) {
        await sleep(2500); // 2.5초마다 상태 확인
        const statusResponse = await fetch(`/api/predictions/${prediction.id}`);
        
        if (!statusResponse.ok) {
            const errorData: ErrorResponse = await statusResponse.json();
            throw new Error(errorData.detail || "분석 상태 확인에 실패했습니다.");
        }
        prediction = await statusResponse.json();
      }

      if (prediction.status === "failed") {
        throw new Error("AI 모델 분석에 실패했습니다: " + prediction.error);
      }

      // 3. 최종 결과 설정
      setAnalysisResult(prediction.output);

    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("알 수 없는 오류가 발생했습니다.");
        }
    } finally {
      setIsLoading(false);
      setLoadingStatus("분석 시작");
    }
  };

  return (
    <motion.div
      className="p-6 md:p-8 space-y-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <h2 className="text-2xl font-semibold text-uplus-navy">
        상담 파일 분석
      </h2>

      <div className="bg-white rounded-xl p-8 shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center">
            <label
              htmlFor="audio-upload"
              className="cursor-pointer group inline-block"
            >
              <div className="w-24 h-24 mx-auto flex items-center justify-center rounded-full bg-gray-100 group-hover:bg-indigo-100 transition-colors">
                <ArrowUpTrayIcon className="w-10 h-10 text-gray-400 group-hover:text-uplus-magenta" />
              </div>
              <p className="mt-2 font-medium text-uplus-navy">
                분석할 파일을 선택하세요
              </p>
              <p className="text-xs text-gray-500">
                (MP3, WAV 파일)
              </p>
            </label>
            <input
              id="audio-upload"
              type="file"
              className="sr-only"
              accept="audio/*"
              onChange={handleFileChange}
            />
          </div>

          {selectedFile && (
            <div className="flex items-center justify-center p-3 border-2 border-dashed rounded-lg">
              <DocumentIcon className="w-6 h-6 text-gray-500 mr-2 flex-shrink-0" />
              <span className="text-sm text-gray-700 truncate">
                {selectedFile.name}
              </span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={!selectedFile || isLoading}
              className="w-full px-4 py-3 bg-uplus-magenta text-white font-bold rounded-lg disabled:bg-gray-300 hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uplus-magenta"
            >
              {isLoading ? loadingStatus : "분석 시작"}
            </button>
          </div>
        </form>
      </div>
      
      {isLoading && (
          <div className="text-center mt-6">
              <p className="text-uplus-navy animate-pulse">{loadingStatus}</p>
          </div>
      )}

      {error && (
        <motion.div 
            className="mt-6 p-4 bg-red-100 text-red-700 rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <p className="font-bold">오류 발생</p>
            <p>{error}</p>
        </motion.div>
      )}

      {analysisResult && <ResultsDisplay data={analysisResult} />}
    </motion.div>
  );
}