import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import seedComplaints from "../lib/data/seedComplaints.json";
import type { Complaint } from "../lib/types";
import { computeCityHealth, computeSectorHealth } from "../lib/utils";

const AFTER_PHOTO = path.resolve(__dirname, "../public/images/hazards/open-manhole-after.jpg");

async function switchRole(page: Page, name: "Tariq" | "Sajid" | "Nasir") {
  await page.getByRole("button", { name: /Switch role/ }).click();
  await page.getByRole("menuitemradio", { name: new RegExp(name) }).click();
  await expect(page.getByRole("button", { name: /Switch role/ })).toHaveAccessibleName(
    new RegExp(`current: [^,]*${name}`),
  );
}

function gotoCitizenTab(page: Page, label: "Explore" | "Map" | "Home" | "My Reports" | "Groups") {
  return page.getByRole("navigation", { name: "Primary" }).getByRole("button", { name: label, exact: true }).click();
}

test.describe("civic health scorecard (unit)", () => {
  test("seed data matches AC-12.3 expected sector and citywide scores", () => {
    const complaints = seedComplaints as Complaint[];
    const sectors = computeSectorHealth(complaints);
    const bySector = new Map(sectors.map((s) => [s.sector, s]));

    expect(bySector.get("F-10")).toMatchObject({ score: 66, grade: "C" });
    expect(bySector.get("F-6")).toMatchObject({ score: 84, grade: "B" });
    expect(bySector.get("G-9")).toMatchObject({ score: 86, grade: "B" });
    expect(bySector.get("I-9")).toMatchObject({ score: 100, grade: "A" });

    const city = computeCityHealth(sectors);
    expect(city.score).toBe(84);
    expect(city.grade).toBe("B");

    // Resolving cmp-001 (F-10 Critical open manhole) lifts F-10 from 66 (C) to 86 (B)
    const afterResolve = complaints.map((c) =>
      c.id === "cmp-001" ? { ...c, status: "RESOLVED" as const } : c,
    );
    const updatedF10 = computeSectorHealth(afterResolve).find((s) => s.sector === "F-10");
    expect(updatedF10).toMatchObject({ score: 86, grade: "B" });
    expect(computeCityHealth(afterResolve)).toMatchObject({ score: 89, grade: "B" });
  });
});

test.describe("civic health scorecard (UI)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/tile\.openstreetmap\.org/, (route) => route.abort());
    await page.goto("/");
  });

  test("Mayor Home and Explore chips show live scores and update from 66 C to 86 B after resolving cmp-001", async ({
    page,
  }) => {
    // 1. Explore sector chips show seed grades: F-10 C, F-6 B, G-9 B, I-9 A
    await gotoCitizenTab(page, "Explore");
    await page.getByTestId("open-filters-button").click();
    await expect(page.getByTestId("sector-chip-grade-F-10")).toHaveText("C");
    await expect(page.getByTestId("sector-chip-grade-F-6")).toHaveText("B");
    await expect(page.getByTestId("sector-chip-grade-G-9")).toHaveText("B");
    await expect(page.getByTestId("sector-chip-grade-I-9")).toHaveText("A");
    await page.keyboard.press("Escape");

    // 2. Mayor Home shows Citywide 84 / B and F-10 66 / C on seed data
    await switchRole(page, "Nasir");
    await expect(page.getByTestId("city-health-score")).toContainText("84");
    await expect(page.getByTestId("city-health-grade")).toContainText("Grade B");
    const f10Row = page.getByTestId("sector-health-F-10");
    await expect(f10Row).toContainText("66/100");
    await expect(f10Row).toContainText("Grade C");

    // 3. Resolve cmp-001 via Worker claim + AI verify + Citizen "+1 Confirm Fix"
    await switchRole(page, "Sajid");
    const queueCard = page.locator('[data-testid="queue-ticket"][data-complaint-id="cmp-001"]');
    await expect(queueCard).toBeVisible();
    await queueCard.getByRole("button", { name: "Claim Ticket" }).click();

    // Navigate to Worker Home tab after claim
    await page.getByRole("navigation", { name: "Worker navigation" }).getByRole("button", { name: /^Home/ }).click();
    const activeCard = page.locator('[data-testid="worker-ticket"][data-complaint-id="cmp-001"]');
    await expect(activeCard).toBeVisible();
    await activeCard.getByTestId("after-photo-input").setInputFiles(AFTER_PHOTO);
    await activeCard.getByTestId("verify-fix-button").click();
    await expect(activeCard.getByTestId("ai-verified-badge")).toBeVisible({ timeout: 10_000 });

    await switchRole(page, "Tariq");
    await gotoCitizenTab(page, "My Reports");
    const reportCard = page.locator('[data-testid="report-card"][data-complaint-id="cmp-001"]');
    await reportCard.getByTestId("confirm-fix-button").click();
    await expect(reportCard.getByTestId("report-status")).toHaveText("Resolved");

    // 4. Explore F-10 chip now shows Grade B
    await gotoCitizenTab(page, "Explore");
    await page.getByTestId("open-filters-button").click();
    await expect(page.getByTestId("sector-chip-grade-F-10")).toHaveText("B");
    await page.keyboard.press("Escape");

    // 5. Mayor Home now shows F-10 86/100 Grade B and Citywide 89/100 Grade B
    await switchRole(page, "Nasir");
    await expect(page.getByTestId("city-health-score")).toContainText("89");
    await expect(page.getByTestId("city-health-grade")).toContainText("Grade B");
    const updatedF10Row = page.getByTestId("sector-health-F-10");
    await expect(updatedF10Row).toContainText("86/100");
    await expect(updatedF10Row).toContainText("Grade B");
  });
});

