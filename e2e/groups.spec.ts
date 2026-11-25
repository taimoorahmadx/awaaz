import { expect, test, type Page } from "@playwright/test";

const GROUPS_KEY = "awaaz.messages.v1";

function gotoTab(page: Page, label: "Explore" | "Map" | "Home" | "My Reports" | "Groups") {
  return page.getByRole("navigation", { name: "Primary" }).getByRole("button", { name: label, exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.route(/tile\.openstreetmap\.org/, (route) => route.abort());
  await page.goto("/");
});

test("groups: 5 channels grouped by type, post persists across reload, embed modal, convert to ticket, read-only alerts, reset", async ({
  page,
}) => {
  await gotoTab(page, "Groups");

  // AC-9.1: 5 channels grouped by type, "Coming soon" removed
  const channelList = page.getByTestId("groups-channel-list");
  await expect(channelList).toBeVisible();
  await expect(channelList.getByText("Locality", { exact: true })).toBeVisible();
  await expect(channelList.getByText("Market", { exact: true })).toBeVisible();
  await expect(channelList.getByText("Civic Interest", { exact: true })).toBeVisible();
  await expect(channelList.getByText("Official Broadcast", { exact: true })).toBeVisible();
  await expect(channelList.getByTestId("group-channel-card")).toHaveCount(5);
  await expect(page.getByText(/coming soon/i)).toHaveCount(0);

  // Enter # F-10/2 Residents
  await channelList.getByRole("button", { name: /# F-10\/2 Residents/ }).click();
  const chatView = page.getByTestId("group-chat-view");
  await expect(chatView).toBeVisible();

  // AC-10.4: Latest Municipal Alert banner shown atop non-official channels
  await expect(chatView.getByTestId("official-alert-banner")).toBeVisible();

  // No voice notes (AC-9.2)
  await expect(chatView.getByRole("button", { name: /record|voice|audio/i })).toHaveCount(0);

  // AC-9.4: Tapping a complaint embed opens ComplaintDetailModal
  const embed = chatView.locator('[data-testid="complaint-embed"][data-complaint-id="cmp-002"]');
  await expect(embed).toBeVisible();
  await expect(embed).toContainText("In Progress");
  await embed.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Garbage heap on Street 23");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);

  // AC-9.2: Post a message and verify persistence after reload
  const uniqueMsg = "Street 23 ke paas streetlight blink kar rahi hai";
  await chatView.getByTestId("group-message-input").fill(uniqueMsg);
  await chatView.getByRole("button", { name: "Send message" }).click();

  const postedBubble = chatView.getByTestId("group-message").filter({ hasText: uniqueMsg });
  await expect(postedBubble).toBeVisible();
  await expect(postedBubble).toContainText("Tariq");

  await page.reload();
  await gotoTab(page, "Groups");
  await page.getByRole("button", { name: /# F-10\/2 Residents/ }).click();
  const persistedBubble = page.getByTestId("group-message").filter({ hasText: uniqueMsg });
  await expect(persistedBubble).toBeVisible();

  // AC-9.5: Convert to Ticket pre-fills Home composer without auto-submitting
  await persistedBubble.getByTestId("convert-to-ticket-btn").click();
  await expect(page.locator("#intake-text")).toHaveValue(uniqueMsg);
  await expect(page.getByTestId("triage-card")).toHaveCount(0);

  // AC-9.3: Municipal Alerts is read-only for citizens
  await gotoTab(page, "Groups");
  await page.getByRole("button", { name: /📢 Municipal Alerts/ }).click();
  await expect(page.getByTestId("channel-readonly-notice")).toBeVisible();
  await expect(page.getByTestId("group-message-input")).toHaveCount(0);
  await expect(page.getByTestId("convert-to-ticket-btn")).toHaveCount(0);

  // AC-6.4: Reset System Data clears posted message and restores seeds
  await page.getByRole("button", { name: /Switch role/ }).click();
  await page.getByTestId("reset-system-data").click();
  await page.getByRole("button", { name: "Back to channels" }).click();
  await page.getByRole("button", { name: /# F-10\/2 Residents/ }).click();
  await expect(page.getByTestId("group-message").filter({ hasText: uniqueMsg })).toHaveCount(0);

  const storedAfterReset = await page.evaluate(
    ([key, text]) => {
      const msgs = JSON.parse(localStorage.getItem(key) ?? "[]") as { text: string }[];
      return msgs.some((m) => m.text === text);
    },
    [GROUPS_KEY, uniqueMsg] as const,
  );
  expect(storedAfterReset).toBe(false);
});

