import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const HAZARDS = path.join(__dirname, "../public/images/hazards");
const POTHOLE_PHOTO = path.join(HAZARDS, "pothole.jpg");
const STORAGE_KEY = "awaaz.complaints.v3";

function gotoTab(page: Page, label: "Explore" | "Map" | "Home" | "My Reports" | "Groups") {
  return page.getByRole("navigation", { name: "Primary" }).getByRole("button", { name: label, exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.route(/tile\.openstreetmap\.org/, (route) => route.abort());
  await page.goto("/");
});

test("citizen photo attachment compresses to JPEG ≤800px and persists on created complaint", async ({ page }) => {
  const input = page.getByTestId("intake-photo-input");
  await expect(input).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
  await expect(input).not.toHaveAttribute("capture");

  // Attach pothole.jpg, verify preview + remove button, then re-attach and submit with text.
  await input.setInputFiles(POTHOLE_PHOTO);
  const preview = page.getByTestId("intake-photo-preview");
  await expect(preview).toBeVisible();
  await expect(preview.locator("img")).toHaveAttribute("src", /^data:image\/jpeg;base64,/);

  await page.getByRole("button", { name: "Remove attached photo" }).click();
  await expect(preview).toHaveCount(0);

  await input.setInputFiles(POTHOLE_PHOTO);
  await expect(preview).toBeVisible();

  await page.locator("#intake-text").fill("Gali mein bara pothole hai");
  const requestPromise = page.waitForRequest(
    (req) => req.url().includes("/api/analyze-audio") && req.method() === "POST",
  );
  await page.getByRole("button", { name: "Send complaint" }).click();

  // Verify multipart payload includes compressed photo and sectorHint.
  const req = await requestPromise;
  const postBody = req.postDataBuffer()?.toString("latin1") ?? "";
  expect(postBody).toContain('name="photo"');
  expect(postBody).toContain('name="sectorHint"');
  expect(postBody).toContain("F-10");

  const triage = page.getByTestId("triage-card");
  await expect(triage).toBeVisible({ timeout: 10_000 });
  const id = await triage.getAttribute("data-complaint-id");
  expect(id).toMatch(/^cmp-\d+$/);

  const triageImg = triage.getByTestId("triage-photo");
  await expect(triageImg).toBeVisible();
  const src = (await triageImg.getAttribute("src")) ?? "";
  expect(src.startsWith("data:image/jpeg")).toBe(true);

  // Confirm compressed dimensions (longest side ≤ 800px).
  const dims = await triageImg.evaluate((el: HTMLImageElement) => ({
    w: el.naturalWidth,
    h: el.naturalHeight,
  }));
  expect(Math.max(dims.w, dims.h)).toBeLessThanOrEqual(800);
  expect(Math.min(dims.w, dims.h)).toBeGreaterThan(0);

  // Confirm Explore feed card also renders the compressed JPEG.
  await gotoTab(page, "Explore");
  const exploreImg = page.locator("article", { hasText: "Gali mein bara pothole hai" }).locator("img");
  await expect(exploreImg).toHaveAttribute("src", /^data:image\/jpeg/);

  const stored = await page.evaluate(
    ([key, cid]) => {
      const list = JSON.parse(localStorage.getItem(key) ?? "[]") as { id: string; beforePhotoUrl: string }[];
      return list.find((c) => c.id === cid);
    },
    [STORAGE_KEY, id] as const,
  );
  expect(stored?.beforePhotoUrl.startsWith("data:image/jpeg")).toBe(true);
});

test("mic recording shows live waveform canvas, advancing timer, and submits on stop", async ({ page }) => {
  await page.getByRole("button", { name: "Record Urdu voice note" }).click();

  const canvas = page.getByTestId("waveform-canvas");
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect((box?.width ?? 0) > 50 && (box?.height ?? 0) > 10).toBe(true);

  const timer = page.getByTestId("recording-timer");
  await expect(timer).toHaveText(/^\d+:\d{2} \/ 0:30$/);
  // Wait for timer to advance at least 1 second.
  await expect(timer).not.toHaveText("0:00 / 0:30", { timeout: 5_000 });

  await page.getByRole("button", { name: "Stop recording" }).click();
  await expect(canvas).toHaveCount(0);

  const triage = page.getByTestId("triage-card");
  await expect(triage).toBeVisible({ timeout: 10_000 });
  await expect(triage.getByText("Offline Mode (Synced locally)")).toBeVisible();
});

test("QuotaExceededError shows friendly Sonner toast without crashing and keeps in-memory state", async ({ page }) => {
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage quota exceeded", "QuotaExceededError");
    };
  });

  await page.locator("#intake-text").fill("F-10 mein kachra hai");
  await page.getByRole("button", { name: "Send complaint" }).click();

  const triage = page.getByTestId("triage-card");
  await expect(triage).toBeVisible({ timeout: 10_000 });
  const id = await triage.getAttribute("data-complaint-id");
  expect(id).toMatch(/^cmp-\d+$/);
  await expect(page.getByText("Storage is full — use Reset System Data in the header")).toBeVisible();

  // In-memory state still reflects the new complaint when switching to My Reports.
  await gotoTab(page, "My Reports");
  await expect(page.locator(`[data-testid="report-card"][data-complaint-id="${id}"]`)).toBeVisible();
});

