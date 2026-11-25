import path from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";

// Golden-path smoke test (AGENTS.md "Golden path"). Runs with AI_FORCE_FALLBACK=1 (see
// playwright.config.ts), so every AI answer is the deterministic DEMO-FALLBACK and no live
// Gemini call is made. Each test gets a fresh browser context, so localStorage starts empty
// and the app seeds its 12 demo complaints.

const SEED_COUNT = 12;
// Keyword fallback (lib/categories.ts): "dhakkan" → Open Manhole → CDA Sanitation, CRITICAL.
const COMPLAINT_TEXT = "F-10 Markaz mein gutter ka dhakkan toota hua hai";
const HAZARDS = path.join(__dirname, "../public/images/hazards");
const AFTER_PHOTO = path.join(HAZARDS, "open-manhole-after.jpg");
// The Open Manhole stock photo — the new ticket's own Before photo.
const BEFORE_PHOTO = path.join(HAZARDS, "open-manhole.jpg");
const STORAGE_KEY = "awaaz.complaints.v3";

async function switchRole(page: Page, name: "Tariq" | "Sajid") {
  await page.getByRole("button", { name: /Switch role/ }).click();
  await page.getByRole("menuitemradio", { name: new RegExp(name) }).click();
  await expect(page.getByRole("button", { name: /Switch role/ })).toHaveAccessibleName(
    new RegExp(`current: ${name}`),
  );
}

function gotoTab(page: Page, label: "Explore" | "Map" | "Home" | "My Reports" | "Groups") {
  return page.getByRole("navigation", { name: "Primary" }).getByRole("button", { name: label, exact: true }).click();
}

function pins(page: Page): Locator {
  return page.locator(".leaflet-marker-pane .awaaz-pin");
}

/** Files a complaint from the Home tab and returns the new complaint id. */
async function fileTicket(page: Page, text: string = COMPLAINT_TEXT): Promise<string> {
  await gotoTab(page, "Home");
  await page.locator("#intake-text").fill(text);
  await page.getByRole("button", { name: "Send complaint" }).click();
  const card = page.getByTestId("triage-card");
  await expect(card).toBeVisible({ timeout: 10_000 });
  // T4.2: if a landmark duplicate is detected (e.g. F-10 Markaz open manhole matches cmp-001),
  // confirm submitting as a separate ticket for the golden path.
  const separateBtn = page.getByTestId("submit-separate-ticket-btn");
  if (await separateBtn.isVisible()) {
    await separateBtn.click();
  }
  await expect(card).toHaveAttribute("data-complaint-id", /^cmp-\d+$/);
  return (await card.getAttribute("data-complaint-id")) as string;
}

/** As Sajid: claims the ticket, uploads `afterPhoto`, runs Verify Fix. Returns the worker card. */
async function claimAndSubmitFix(page: Page, id: string, afterPhoto: string): Promise<Locator> {
  await switchRole(page, "Sajid");
  const queued = page.locator(`[data-testid="queue-ticket"][data-complaint-id="${id}"]`);
  await expect(queued).toBeVisible();
  await queued.getByRole("button", { name: "Claim Ticket" }).click();

  // The portal switches to the worker Home tab on its own after a claim.
  await expect(
    page.getByRole("navigation", { name: "Worker navigation" }).getByRole("button", { name: /^Home/ }),
  ).toHaveAttribute("aria-current", "page");
  const card = page.locator(`[data-testid="worker-ticket"][data-complaint-id="${id}"]`);
  await expect(card).toBeVisible();

  // T4.5: Worker Home route card shows mini Leaflet map, landmark, coordinates, and Google Maps link.
  const routeCard = card.getByTestId("worker-route-card");
  await expect(routeCard).toBeVisible();
  await expect(routeCard.locator(".leaflet-marker-pane .awaaz-pin")).toHaveCount(1);
  await expect(routeCard.getByTestId("worker-route-coords")).toHaveText(/^-?\d+\.\d{4}, -?\d+\.\d{4}$/);
  const mapsLink = routeCard.getByRole("link", { name: /Open in Google Maps/ });
  await expect(mapsLink).toHaveAttribute("href", /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=-?\d+(\.\d+)?,-?\d+(\.\d+)?$/);
  await expect(mapsLink).toHaveAttribute("target", "_blank");
  await expect(mapsLink).toHaveAttribute("rel", "noopener noreferrer");

  await card.getByTestId("after-photo-input").setInputFiles(afterPhoto);
  await card.getByTestId("verify-fix-button").click();
  return card;
}

async function claimAndVerify(page: Page, id: string): Promise<Locator> {
  const card = await claimAndSubmitFix(page, id, AFTER_PHOTO);
  await expect(card.getByTestId("ai-verified-badge")).toBeVisible({ timeout: 10_000 });
  return card;
}

function storedComplaint(page: Page, id: string) {
  return page.evaluate(
    ([key, cid]) => {
      const list = JSON.parse(localStorage.getItem(key) ?? "[]") as {
        id: string;
        status: string;
        department: string;
        category: string;
        aiVerification?: { passed: boolean; confidence: number; isOfflineFallback?: boolean };
      }[];
      return list.find((c) => c.id === cid);
    },
    [STORAGE_KEY, id] as const,
  );
}

/** Reads "NN" from "(NN%)" in a badge's text. */
function percentIn(text: string): number {
  return Number(/\((\d+)%\)/.exec(text)?.[1]);
}

test.beforeEach(async ({ page }) => {
  // Offline-safe: never fetch external map tiles.
  await page.route(/tile\.openstreetmap\.org/, (route) => route.abort());
  await page.goto("/");
});

test("golden path: report → map pin → worker AI verify → citizen sign-off", async ({ page }) => {
  // 1. Citizen Ingestion (as Tariq, the default role).
  await expect(page.getByRole("button", { name: /Switch role/ })).toHaveAccessibleName(/current: Tariq/);
  await gotoTab(page, "Map");
  await expect(pins(page)).toHaveCount(SEED_COUNT);

  const id = await fileTicket(page);
  const triage = page.getByTestId("triage-card");
  // Fixed category table: open manhole → CDA Sanitation, default urgency CRITICAL.
  await expect(triage.getByTestId("triage-department")).toHaveText("CDA Sanitation");
  await expect(triage.getByTestId("triage-urgency")).toHaveText("CRITICAL");
  // The offline chip proves the DEMO-FALLBACK answered (no live AI call).
  await expect(triage.getByText("Offline Mode (Synced locally)")).toBeVisible();
  expect((await storedComplaint(page, id))?.category).toBe("Open Manhole");

  await gotoTab(page, "Map");
  await expect(pins(page)).toHaveCount(SEED_COUNT + 1);

  // 2. Worker AI Verification.
  const workerCard = await claimAndVerify(page, id);
  await expect(workerCard.getByTestId("ai-verified-badge")).toContainText("AI Verified");
  await expect(workerCard.getByText("Pending Sign-off", { exact: true })).toBeVisible();

  // 3. Citizen Sign-Off.
  await switchRole(page, "Tariq");
  await gotoTab(page, "My Reports");
  const report = page.locator(`[data-testid="report-card"][data-complaint-id="${id}"]`);
  await expect(report.getByTestId("report-status")).toHaveText("Pending Sign-off");
  await report.getByTestId("confirm-fix-button").click();
  await expect(report.getByTestId("report-status")).toHaveText("Resolved");
  await expect(report.getByTestId("confirm-fix-button")).toHaveCount(0);
  // "Ticket turns vibrant green": resolved card border + solid green status pill.
  await expect(report).toHaveAttribute("data-status", "RESOLVED");
  await expect(report).toHaveClass(/(^|\s)border-green-500\/60(\s|$)/);
  await expect(report.getByTestId("report-status")).toHaveClass(/(^|\s)bg-green-500(\s|$)/);

  // Persisted to localStorage.
  expect((await storedComplaint(page, id))?.status).toBe("RESOLVED");

  // Open detail modal from My Reports and assert full lifecycle timeline.
  await report.click();
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible();
  const timeline = modal.getByRole("list", { name: "Lifecycle timeline" });
  await expect(timeline).toBeVisible();
  await expect(timeline.getByText("Reported", { exact: true })).toBeVisible();
  await expect(timeline.getByText("Claimed by worker", { exact: true })).toBeVisible();
  await expect(timeline.getByText("AI Verified", { exact: true })).toBeVisible();
  await expect(timeline.getByText("Resolved", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(modal).not.toBeVisible();
});

test("verify badge shows spec'd confidence (≤ 100%) and reasoning", async ({ page }) => {
  const id = await fileTicket(page);
  const workerCard = await claimAndVerify(page, id);
  const badgeText = (await workerCard.getByTestId("ai-verified-badge").textContent()) ?? "";

  expect(badgeText).not.toContain("9400%");
  const pct = percentIn(badgeText);
  expect(pct).toBeGreaterThanOrEqual(0);
  expect(pct).toBeLessThanOrEqual(100);
  // AC-4.5: the badge explains its verdict.
  expect(badgeText.split("):")[1]?.trim() ?? "").not.toBe("");
  await expect(workerCard.getByText("Offline Mode (Synced locally)")).toBeVisible();

  const stored = await storedComplaint(page, id);
  expect(stored?.aiVerification?.passed).toBe(true);
  expect(stored?.aiVerification?.confidence).toBeGreaterThan(0);
  expect(stored?.aiVerification?.confidence).toBeLessThanOrEqual(1);
  expect(stored?.aiVerification?.isOfflineFallback).toBe(true);

  await switchRole(page, "Tariq");
  await gotoTab(page, "My Reports");
  const aiLine = page.locator(`[data-testid="report-card"][data-complaint-id="${id}"]`).getByTestId("report-ai-line");
  const linePct = percentIn((await aiLine.textContent()) ?? "");
  expect(linePct).toBeGreaterThanOrEqual(0);
  expect(linePct).toBeLessThanOrEqual(100);
});

test("verify fallback rejects an After photo identical to the Before photo", async ({ page }) => {
  const id = await fileTicket(page);
  const workerCard = await claimAndSubmitFix(page, id, BEFORE_PHOTO);

  const rejected = workerCard.getByTestId("ai-rejected-badge");
  await expect(rejected).toBeVisible({ timeout: 10_000 });
  await expect(rejected).toContainText("AI Rejected");
  await expect(rejected).toContainText("identical to the Before photo");
  const pct = percentIn((await rejected.textContent()) ?? "");
  expect(pct).toBeGreaterThanOrEqual(0);
  expect(pct).toBeLessThanOrEqual(100);
  await expect(workerCard.getByTestId("ai-verified-badge")).toHaveCount(0);

  // AC-4.6: status stays In Progress; the rejection is stored.
  await expect(workerCard.getByText("In Progress", { exact: true })).toBeVisible();
  const stored = await storedComplaint(page, id);
  expect(stored?.status).toBe("IN_PROGRESS");
  expect(stored?.aiVerification?.passed).toBe(false);
  expect(stored?.aiVerification?.isOfflineFallback).toBe(true);
});

test("triage fallback maps typed keywords to the fixed category table", async ({ page }) => {
  const id = await fileTicket(page, "street light kharab hai F-6");
  const triage = page.getByTestId("triage-card");
  await expect(triage.getByTestId("triage-department")).toHaveText("IESCO");
  await expect(triage.getByText("Offline Mode (Synced locally)")).toBeVisible();
  const stored = await storedComplaint(page, id);
  expect(stored?.category).toBe("Broken Streetlight");
  expect(stored?.department).toBe("IESCO");
});

test("modal opens from explore card and shows lifecycle timeline", async ({ page }) => {
  // Navigate to Explore tab and open the first card.
  await gotoTab(page, "Explore");
  const cards = page.locator("ul li article");
  await expect(cards.first()).toBeVisible({ timeout: 5_000 });

  // Click the first card body — the article is a button that opens the modal.
  await cards.first().click();

  // Modal must be open.
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible({ timeout: 5_000 });

  // Timeline section must have at least one "Reported" entry (synthesized from seed).
  await expect(
    modal.getByRole("list", { name: "Lifecycle timeline" }).getByText("Reported", { exact: true }),
  ).toBeVisible();

  // Escape closes the modal.
  await page.keyboard.press("Escape");
  await expect(modal).not.toBeVisible();
});

test("worker Home only shows tickets assigned to the active worker", async ({ page }) => {
  await page.waitForFunction((key) => Boolean(localStorage.getItem(key)), STORAGE_KEY);
  await page.evaluate((key) => {
    const list = JSON.parse(localStorage.getItem(key) ?? "[]") as {
      id: string;
      status: string;
      assignedTo?: { workerId: string; workerName: string };
    }[];
    const other = list.find((c) => c.id === "cmp-002");
    if (other) {
      other.assignedTo = { workerId: "worker-other", workerName: "Other" };
    }
    localStorage.setItem(key, JSON.stringify(list));
  }, STORAGE_KEY);

  await page.reload();
  await switchRole(page, "Sajid");
  await page.getByRole("navigation", { name: "Worker navigation" }).getByRole("button", { name: /^Home/ }).click();

  await expect(page.locator('[data-testid="worker-ticket"][data-complaint-id="cmp-006"]')).toBeVisible();
  await expect(page.locator('[data-testid="worker-ticket"][data-complaint-id="cmp-002"]')).toHaveCount(0);
});
