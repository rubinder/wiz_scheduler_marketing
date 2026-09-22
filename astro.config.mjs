import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://wizscheduler.com",
  trailingSlash: "never",
  build: { format: "directory" },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es"],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    react(),
    sitemap({
      i18n: { defaultLocale: "en", locales: { en: "en-US", es: "es-US" } },
      filter: (page) => !page.endsWith("/404"),
    }),
  ],
});
