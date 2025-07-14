import { defineConfig } from "vite";

export default defineConfig({
  base: "/2d-portfolio-website/",
  build: {
    minify: "terser",
  },
});
