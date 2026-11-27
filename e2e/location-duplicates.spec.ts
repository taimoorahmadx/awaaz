import { expect, test, type Page } from "@playwright/test";
import { haversineMeters, isInIslamabadBox, resolveComplaintLocation } from "@/lib/utils";

const STORAGE_KEY = "awaaz.complaints.v3";

async function switchRole(page: Page, name: "Tariq" | "Ayesha" | "Anonymous Citizen") {
  await page.getByRole("button", { name: /Switch role/ }).click();
  await page.getByRole("menuitemradio", { name: new RegExp(name) }).click();
  await expect(page.getByRole("button", { name: /Switch role/ })).toHaveAccessibleName(
    new RegExp(`current: ${name}`),
  );
}

async function submitIntakeText(page: Page, text: string) {
  await page.locator("#intake-text").fill(text);
  await page.getByRole("button", { name: "Send complaint" }).click();
  const generateBtn = page.getByTestId("generate-ticket-btn");
  await expect(generateBtn).toBeVisible({ timeout: 10_000 });
  await generateBtn.click();
  const card = page.getByTestId("triage-card");
  await expect(card).toBeVisible({ timeout: 10_000 });
  await card.getByTestId("approve-submit-ticket-btn").click();
}

function getStoredComplaints(page: Page) {
  return page.evaluate((key) => {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as {
      id: string;
      urgency: string;
      location: { lat: number; lng: number; sector: string; source?: string };
      communityImpact: { affectedCount: number; impactConfirmedBy?: string[] };
      history?: { type: string; note?: string }[];
    }[];
  }, STORAGE_KEY);
}

test.describe("location resolution & proximity duplicate detection (T4.2)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/tile\.openstreetmap\.org/, (route) => route.abort());
    await page.goto("/");
  });

  test("GPS granted at cmp-001: DuplicateCard +1 Impacts Me Too as Ayesha and Anonymous (stays CRITICAL)", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 33.695, longitude: 73.013, accuracy: 12 });

    // Ayesha reports an open manhole at cmp-001's GPS coordinates.
    await switchRole(page, "Ayesha");
    await submitIntakeText(page, "Open manhole near petrol pump");

    await expect(page.getByTestId("triage-location-chip")).toHaveText("📍 GPS");
    const dupCard = page.getByTestId("duplicate-card");
    await expect(dupCard).toBeVisible();
    await expect(dupCard).toHaveAttribute("data-complaint-id", "cmp-001");
    await expect(dupCard).toContainText(/similar issue was reported ~\d+ m away/i);

    await dupCard.getByTestId("impact-me-too-btn").click();
    await expect(dupCard.getByTestId("impact-confirmed-msg")).toBeVisible();
    await expect(dupCard.getByTestId("impact-me-too-btn")).toBeDisabled();
    await expect(dupCard.getByTestId("impact-me-too-btn")).toContainText("You already reported this");

    let all = await getStoredComplaints(page);
    expect(all).toHaveLength(12);
    let cmp001 = all.find((c) => c.id === "cmp-001");
    expect(cmp001?.communityImpact.affectedCount).toBe(321);
    expect(cmp001?.communityImpact.impactConfirmedBy).toEqual(["citizen-ayesha"]);
    expect(cmp001?.urgency).toBe("CRITICAL");

    // Repeat as Anonymous Citizen -> impact count +1 again, urgency stays CRITICAL (already max).
    await switchRole(page, "Anonymous Citizen");
    await submitIntakeText(page, "Open manhole hazard here");

    await expect(page.getByTestId("triage-location-chip")).toHaveText("📍 GPS");
    const dupCard2 = page.getByTestId("duplicate-card");
    await expect(dupCard2).toHaveAttribute("data-complaint-id", "cmp-001");
    await dupCard2.getByTestId("impact-me-too-btn").click();
    await expect(dupCard2.getByTestId("impact-confirmed-msg")).toBeVisible();

    all = await getStoredComplaints(page);
    expect(all).toHaveLength(12);
    cmp001 = all.find((c) => c.id === "cmp-001");
    expect(cmp001?.communityImpact.affectedCount).toBe(322);
    expect(cmp001?.communityImpact.impactConfirmedBy).toEqual(["citizen-ayesha", "citizen-anonymous"]);
    expect(cmp001?.urgency).toBe("CRITICAL");
    expect(cmp001?.history?.some((h) => h.type === "IMPACT_ADDED")).toBe(true);
  });

  test("2 impact confirmations raise a HIGH complaint (cmp-005) to CRITICAL", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    // cmp-005 coordinates (F-6 Super Market, WASA / Sewage Leak, HIGH, reporter Ayesha)
    await context.setGeolocation({ latitude: 33.728, longitude: 73.076, accuracy: 15 });

    // Confirmation 1: Tariq
    await submitIntakeText(page, "Sewage water overflowing on service road");
    let dupCard = page.getByTestId("duplicate-card");
    await expect(dupCard).toHaveAttribute("data-complaint-id", "cmp-005");
    await dupCard.getByTestId("impact-me-too-btn").click();

    let cmp005 = (await getStoredComplaints(page)).find((c) => c.id === "cmp-005");
    expect(cmp005?.urgency).toBe("HIGH");
    expect(cmp005?.communityImpact.impactConfirmedBy).toHaveLength(1);

    // Confirmation 2: Anonymous Citizen -> HIGH -> CRITICAL
    await switchRole(page, "Anonymous Citizen");
    await submitIntakeText(page, "Dirty sewage drain overflowing");
    dupCard = page.getByTestId("duplicate-card");
    await expect(dupCard).toHaveAttribute("data-complaint-id", "cmp-005");
    await dupCard.getByTestId("impact-me-too-btn").click();

    cmp005 = (await getStoredComplaints(page)).find((c) => c.id === "cmp-005");
    expect(cmp005?.urgency).toBe("CRITICAL");
    expect(cmp005?.communityImpact.impactConfirmedBy).toEqual(["citizen-tariq", "citizen-anonymous"]);
    expect(cmp005?.history?.some((h) => h.type === "URGENCY_RAISED")).toBe(true);
  });

  test("GPS denied + landmark match shows Landmark chip and DuplicateCard for cmp-001", async ({ page, context }) => {
    await context.clearPermissions();

    await submitIntakeText(page, "F-10 Markaz petrol pump ke paas gutter khula hai");

    await expect(page.getByTestId("triage-location-chip")).toContainText("Landmark");
    const dupCard = page.getByTestId("duplicate-card");
    await expect(dupCard).toBeVisible();
    await expect(dupCard).toHaveAttribute("data-complaint-id", "cmp-001");

    // Tariq is cmp-001's reporter -> "+1" disabled with "You already reported this".
    await expect(dupCard.getByTestId("impact-me-too-btn")).toBeDisabled();
    await expect(dupCard.getByTestId("impact-me-too-btn")).toContainText("You already reported this");

    // Submit as Separate Ticket creates a new LANDMARK ticket.
    await dupCard.getByTestId("submit-separate-ticket-btn").click();
    await expect(page.getByTestId("triage-card")).toHaveAttribute("data-complaint-id", /^cmp-\d+$/);
    const all = await getStoredComplaints(page);
    expect(all).toHaveLength(13);
    expect(all[0].location.source).toBe("LANDMARK");
  });

  test("GPS denied + no landmark match shows Sector estimate chip and creates ticket directly", async ({
    page,
    context,
  }) => {
    await context.clearPermissions();

    await submitIntakeText(page, "Gali mein kachra jama hai");

    await expect(page.getByTestId("triage-location-chip")).toHaveText("📍 Sector estimate");
    await expect(page.getByTestId("duplicate-card")).toHaveCount(0);
    await expect(page.getByTestId("triage-card")).toHaveAttribute("data-complaint-id", /^cmp-\d+$/);

    const all = await getStoredComplaints(page);
    expect(all).toHaveLength(13);
    expect(all[0].location.source).toBe("SECTOR_CENTRE");
  });
});

test.describe("location utility checks (unit)", () => {
  test("haversineMeters and GPS fallback boundaries", () => {
    expect(haversineMeters({ lat: 33.695, lng: 73.013 }, { lat: 33.695, lng: 73.013 })).toBe(0);
    // ~111m per 0.001 deg latitude
    const d = haversineMeters({ lat: 33.695, lng: 73.013 }, { lat: 33.696, lng: 73.013 });
    expect(d).toBeGreaterThan(100);
    expect(d).toBeLessThan(120);

    expect(isInIslamabadBox(33.695, 73.013)).toBe(true);
    expect(isInIslamabadBox(24.8607, 67.0011)).toBe(false); // Karachi

    // Low-accuracy GPS (>100m) falls back to landmark/sector.
    const lowAcc = resolveComplaintLocation({
      gps: { lat: 33.695, lng: 73.013, accuracy: 250 },
      aiLandmark: "",
      typedText: "random street",
      aiSector: "F-10",
      homeSector: "F-10",
      city: "Islamabad",
    });
    expect(lowAcc.location.source).toBe("SECTOR_CENTRE");
    expect(lowAcc.chipLabel).toBe("📍 Sector estimate");
  });
});

