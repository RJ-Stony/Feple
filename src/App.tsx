import { useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/common/Layout";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Sessions from "./pages/Sessions";
import Politeness from "./pages/Politeness";

export default function App() {
  // 공통으로 사용할 PDF 캡처용 ref
  const printRef = useRef<HTMLDivElement>(null);

  return (
    <BrowserRouter>
      {/* printRef를 Layout에 전달 */}
      <Layout printRef={printRef}>
        <Routes>
          {/* Dashboard에도 동일한 printRef를 props로 전달 */}
          <Route path="/" element={<Dashboard printRef={printRef} />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/politeness" element={<Politeness />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
