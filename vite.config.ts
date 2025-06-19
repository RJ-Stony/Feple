import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // base: "/Feple/", // 꼭 슬래시로 감싸기!
  plugins: [react()],
});
