import { defineConfig } from "@playwright/test";

// Golden-path smoke tests. Runs against a production build (`npm run build` first) on
// port 3100 so it never clashes with the dev server on 3000. AI_FORCE_FALLBACK=1 means
// no live Gemini calls: every AI route answers with its deterministic DEMO-FALLBACK.
const PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        launchOptions: {
          // Fake mic for MediaRecorder tests (T3.2).
          args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
        },
      },
    },
  ],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    port: PORT,
    env: { AI_FORCE_FALLBACK: "1" },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
