import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import { ArrowUpTrayIcon, DocumentIcon } from "@heroicons/react/24/outline";

const pageVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      ease: "easeOut",
      duration: 0.5,
    },
  },
};

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    // TODO: 여기에 파일 업로드 및 API 호출 로직을 추가하기
    console.log("분석 시작:", selectedFile.name);
    setIsLoading(true);
    // 3초 후 로딩 종료
    setTimeout(() => setIsLoading(false), 3000);
  };

  return (
    <motion.div
      className="p-6 space-y-6"
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
                (MP3, WAV, M4A 등)
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
              {isLoading ? "분석 중..." : "분석 시작"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}