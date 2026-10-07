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
      i18n: { defaultLocale: "en", locales: { en: "en", es: "es" } },
      filter: (page) => !page.endsWith("/404"),
      serialize: (item) => {
        // Home page: highest priority, changes weekly
        if (item.url === "https://wizscheduler.com/" || item.url === "https://wizscheduler.com/es") {
          return {
            ...item,
            changefreq: "weekly",
            priority: 1.0,
          };
        }
        // Key pages: high priority, change monthly
        if (
          item.url.includes("/features") ||
          item.url.includes("/free-schedule-checker") ||
          item.url.includes("/nyc-fair-workweek-scheduling")
        ) {
          return {
            ...item,
            changefreq: "monthly",
            priority: 0.9,
          };
        }
        // Compare page: medium priority, rarely changes
        if (item.url.includes("/compare/")) {
          return {
            ...item,
            changefreq: "monthly",
            priority: 0.7,
          };
        }
        // Legal pages: low priority, rarely changes
        if (
          item.url.includes("/privacy-policy") ||
          item.url.includes("/terms") ||
          item.url.includes("/dpa")
        ) {
          return {
            ...item,
            changefreq: "yearly",
            priority: 0.5,
          };
        }
        return item;
      },
    }),
  ],
});
