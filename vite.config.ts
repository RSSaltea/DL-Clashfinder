import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const pagesBasePath = process.env.VITE_BASE_PATH ?? "/DL-Clashfinder/";
const base = process.env.NODE_ENV === "production" ? pagesBasePath : "/";

export default defineConfig({
  base,
  plugins: [react()],
});
