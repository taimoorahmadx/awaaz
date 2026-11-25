import { expect, test, type Page } from "@playwright/test";

const CONTRACTORS_KEY = "awaaz.contractors.v1";

async function switchRole(page: Page, name: "Tariq" | "Nasir") {
  await page.getByRole("button", { name: /Switch role/ }).click();
  await page.getByRole("menuitemradio", { name: new RegExp(name) }).click();
  await expect(page.getByRole("button", { name: /Switch role/ })).toHaveAccessibleName(
    new RegExp(`current: [^,]*${name}`),
  );
}

function gotoCitizenTab(page: Page, label: "Explore" | "Map" | "Home" | "My Reports" | "Groups") {
  return page.getByRole("navigation", { name: "Primary" }).getByRole("button", { name: label, exact: true }).click();
}

function gotoMayorTab(page: Page, label: "Map" | "Alerts" | "Home" | "Depts" | "Contrs") {
  return page.getByRole("navigation", { name: "Mayor portal sections" }).getByRole("tab", { name: new RegExp(label) }).click();
}

test.beforeEach(async ({ page }) => {
  await page.route(/tile\.openstreetmap\.org/, (route) => route.abort());
  await page.goto("/");
});

test("mayor desk: contractor payout freeze persists across reload, reset restores ACTIVE, and emergency broadcast lands in Groups", async ({
  page,
}) => {
  // 1. Switch to Mayor -> Contractors -> Freeze Apex Infra Ltd
  await switchRole(page, "Nasir");
  await gotoMayorTab(page, "Contrs");

  const apexCard = page.locator('[data-testid="contractor-card"][data-contractor-id="ctr-apex"]');
  await expect(apexCard).toBeVisible();
  await expect(apexCard.getByTestId("contractor-status-pill")).toHaveText("ACTIVE");
  await expect(apexCard.getByText("Freeze Payout")).toBeVisible();

  await apexCard.getByTestId("contractor-freeze-switch-ctr-apex").click();
  await expect(apexCard.getByTestId("contractor-status-pill")).toHaveText("FROZEN");
  await expect(apexCard.getByText("Unfreeze Payout")).toBeVisible();

  // Reload page -> switch back to Mayor -> Contrs -> still FROZEN
  await page.reload();
  await switchRole(page, "Nasir");
  await gotoMayorTab(page, "Contrs");

  const apexCardAfterReload = page.locator('[data-testid="contractor-card"][data-contractor-id="ctr-apex"]');
  await expect(apexCardAfterReload.getByTestId("contractor-status-pill")).toHaveText("FROZEN");
  await expect(apexCardAfterReload.getByText("Unfreeze Payout")).toBeVisible();

  const storedFrozen = await page.evaluate((key) => {
    const list = JSON.parse(localStorage.getItem(key) ?? "[]") as { id: string; payoutStatus: string }[];
    return list.find((c) => c.id === "ctr-apex")?.payoutStatus;
  }, CONTRACTORS_KEY);
  expect(storedFrozen).toBe("FROZEN");

  // 2. Mayor -> Alerts -> Broadcast Emergency Notice
  await gotoMayorTab(page, "Alerts");
  const titleText = "Flash Flood Advisory";
  const bodyText = "Zero Point & F-10 underpass traffic diverted due to heavy rain.";
  await page.getByTestId("broadcast-title-input").fill(titleText);
  await page.getByTestId("broadcast-message-input").fill(bodyText);
  await page.getByTestId("broadcast-submit-btn").click();

  const expectedFullText = `${titleText}: ${bodyText}`;
  await expect(page.getByTestId("latest-broadcast-preview")).toContainText(expectedFullText);

  // 3. Switch to Tariq -> Groups -> Municipal Alerts shows broadcast, and another channel shows banner
  await switchRole(page, "Tariq");
  await gotoCitizenTab(page, "Groups");

  await page.getByRole("button", { name: /📢 Municipal Alerts/ }).click();
  const officialMsg = page.getByTestId("group-message").filter({ hasText: expectedFullText });
  await expect(officialMsg).toBeVisible();
  await expect(officialMsg).toContainText("Comm. Nasir");
  await expect(officialMsg).toContainText("Official Alert");

  await page.getByRole("button", { name: "Back to channels" }).click();
  await page.getByRole("button", { name: /# F-10\/2 Residents/ }).click();
  await expect(page.getByTestId("official-alert-banner")).toContainText(expectedFullText);

  // 4. Reset System Data restores contractor status to ACTIVE
  await page.getByRole("button", { name: /Switch role/ }).click();
  await page.getByTestId("reset-system-data").click();
  await switchRole(page, "Nasir");
  await gotoMayorTab(page, "Contrs");
  await expect(
    page.locator('[data-testid="contractor-card"][data-contractor-id="ctr-apex"]').getByTestId("contractor-status-pill"),
  ).toHaveText("ACTIVE");
});

