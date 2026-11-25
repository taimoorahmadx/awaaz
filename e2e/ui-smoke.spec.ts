import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

// UI smoke test for the shadcn/ui foundation (T3.0b): the civic dark theme survives the shadcn
// variables, every main screen is screenshotted for visual review, and shadcn overlays stack above
// Leaflet. Runs with AI_FORCE_FALLBACK=1 like the golden path (see playwright.config.ts).

const SEED_COUNT = 12;
// Absolute SCREENS_DIR wins (used to capture "before" shots outside test-results/, which Playwright wipes).
const SCREENS_DIR = path.resolve(__dirname, "..", process.env.SCREENS_DIR ?? "test-results/screens");

type CitizenTab = "Explore" | "Map" | "Home" | "My Reports" | "Groups";

async function switchRole(page: Page, name: "Tariq" | "Sajid" | "Nasir") {
  await page.getByRole("button", { name: /Switch role/ }).click();
  await page.getByRole("menuitemradio", { name: new RegExp(name) }).click();
  await expect(page.getByRole("button", { name: /Switch role/ })).toHaveAccessibleName(
    new RegExp(`current: [^,]*${name}`),
  );
}

function gotoTab(page: Page, label: CitizenTab) {
  return page.getByRole("navigation", { name: "Primary" }).getByRole("button", { name: label, exact: true }).click();
}

function shot(page: Page, name: string) {
  return page.screenshot({ path: path.join(SCREENS_DIR, `${name}.png`), fullPage: true, animations: "disabled" });
}

test.describe("ui smoke (page)", () => {
  test.beforeEach(async ({ page }) => {
    // Offline-safe: never fetch external map tiles.
    await page.route(/tile\.openstreetmap\.org/, (route) => route.abort());
    await page.goto("/");
  });

  test("theme: dark class and civic palette", async ({ page }) => {
    await expect(page.locator("html")).toHaveClass(/(^|\s)dark(\s|$)/);
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBe("rgb(7, 11, 18)");

    // Resolve each shadcn variable through hsl(var(--x)), exactly as tailwind.config.ts does.
    // Invalid values (e.g. oklch inside hsl()) resolve to transparent and fail here.
    const expected: Record<string, string> = {
      "--background": "rgb(7, 11, 18)",
      "--card": "rgb(15, 22, 34)",
      "--muted": "rgb(22, 32, 48)",
      "--border": "rgb(34, 48, 71)",
      "--primary": "rgb(16, 185, 129)",
      "--foreground": "rgb(241, 245, 249)",
      "--popover": "rgb(15, 22, 34)",
      "--secondary": "rgb(22, 32, 48)",
      "--accent": "rgb(22, 32, 48)",
      "--input": "rgb(34, 48, 71)",
      "--muted-foreground": "rgb(138, 154, 179)",
      "--ring": "rgb(16, 185, 129)",
    };
    const resolved = await page.evaluate((vars) => {
      const out: Record<string, string> = {};
      for (const v of vars) {
        const el = document.createElement("div");
        el.style.backgroundColor = `hsl(var(${v}))`;
        document.body.appendChild(el);
        out[v] = getComputedStyle(el).backgroundColor;
        el.remove();
      }
      return out;
    }, Object.keys(expected));
    expect(resolved).toEqual(expected);
  });

  test("screenshots: every citizen tab, worker and mayor portal", async ({ page }) => {
    const tabs: [CitizenTab, string][] = [
      ["Explore", "explore"],
      ["Map", "map"],
      ["Home", "home"],
      ["My Reports", "my-reports"],
      ["Groups", "groups"],
    ];
    for (const [label, slug] of tabs) {
      await gotoTab(page, label);
      if (label === "Map") {
        await expect(page.locator(".leaflet-marker-pane .awaaz-pin")).toHaveCount(SEED_COUNT);
      } else {
        await page.waitForLoadState("networkidle");
      }
      await shot(page, `citizen-${slug}`);
    }

    await switchRole(page, "Sajid");
    await expect(page.getByRole("navigation", { name: "Worker navigation" })).toBeVisible();
    await shot(page, "worker-sajid");

    await switchRole(page, "Nasir");
    await expect(page.getByRole("navigation", { name: "Mayor portal sections" })).toBeVisible();
    await shot(page, "mayor-nasir");
  });
});

test("app icon / favicon: loading / produces no console errors and no 404 responses", async ({ page }) => {
  const consoleErrors: string[] = [];
  const notFoundUrls: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("response", (res) => {
    if (res.status() === 404) notFoundUrls.push(res.url());
  });

  await page.route(/tile\.openstreetmap\.org/, (route) => route.abort());
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Verify Next emitted the icon link and it loads without 404.
  const iconHref = await page.locator('link[rel="icon"]').getAttribute("href");
  expect(iconHref).toBeTruthy();
  const iconRes = await page.request.get(iconHref!);
  expect(iconRes.status()).toBe(200);

  expect(notFoundUrls, `Unexpected 404 responses: ${notFoundUrls.join(", ")}`).toEqual([]);
  expect(consoleErrors, `Unexpected console errors: ${consoleErrors.join(", ")}`).toEqual([]);
});

test("PWA manifest: /manifest.webmanifest returns 200 with standalone display and icons", async ({ page }) => {
  await page.route(/tile\.openstreetmap\.org/, (route) => route.abort());
  await page.goto("/");

  const manifestLink = page.locator('link[rel="manifest"]');
  await expect(manifestLink).toHaveAttribute("href", "/manifest.webmanifest");

  const res = await page.request.get("/manifest.webmanifest");
  expect(res.status()).toBe(200);
  const manifest = (await res.json()) as {
    name: string;
    short_name: string;
    display: string;
    background_color: string;
    theme_color: string;
    icons: { src: string; sizes: string; type?: string }[];
  };
  expect(manifest.name).toBe("Awaaz");
  expect(manifest.short_name).toBe("Awaaz");
  expect(manifest.display).toBe("standalone");
  expect(manifest.background_color).toBe("#070b12");
  expect(manifest.theme_color).toBe("#070b12");
  expect(manifest.icons.map((i) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));

  for (const icon of manifest.icons) {
    const iconRes = await page.request.get(icon.src);
    expect(iconRes.status(), `Icon ${icon.src} should load`).toBe(200);
  }
});

for (const width of [375, 430] as const) {
  test(`mobile layout at ${width}px: zero horizontal overflow and screenshots saved`, async ({ page }) => {
    const height = width === 375 ? 844 : 932;
    await page.setViewportSize({ width, height });
    await page.route(/tile\.openstreetmap\.org/, (route) => route.abort());
    await page.goto("/");

    const assertNoOverflow = async (label: string) => {
      const dims = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(dims.scrollWidth, `${label} at ${width}px overflowed horizontally`).toBeLessThanOrEqual(
        dims.innerWidth,
      );
    };

    const tabs: [CitizenTab, string][] = [
      ["Explore", "explore"],
      ["Map", "map"],
      ["Home", "home"],
      ["My Reports", "my-reports"],
      ["Groups", "groups"],
    ];
    for (const [label, slug] of tabs) {
      await gotoTab(page, label);
      if (label === "Map") {
        await expect(page.locator(".leaflet-marker-pane .awaaz-pin")).toHaveCount(SEED_COUNT);
      } else {
        await page.waitForLoadState("networkidle");
      }
      await assertNoOverflow(`citizen-${slug}`);
      await shot(page, `${width}-citizen-${slug}`);
    }

    // Open a group channel too
    await page.getByRole("button", { name: /# F-10\/2 Residents/ }).click();
    await expect(page.getByRole("textbox")).toBeVisible();
    await assertNoOverflow("citizen-group-chat");
    await shot(page, `${width}-citizen-group-chat`);

    // Worker portal: Queue, Home, Profile
    await switchRole(page, "Sajid");
    const workerNav = page.getByRole("navigation", { name: "Worker navigation" });
    await expect(workerNav).toBeVisible();
    for (const [label, slug] of [
      ["Queue", "queue"],
      ["Home", "home"],
      ["Profile", "profile"],
    ] as const) {
      await workerNav.getByRole("button", { name: new RegExp(`^${label}`) }).click();
      if (slug === "home") {
        await expect(
          page.locator('[data-testid="worker-route-card"] .leaflet-marker-pane .awaaz-pin').first(),
        ).toBeVisible();
      }
      await assertNoOverflow(`worker-${slug}`);
      await shot(page, `${width}-worker-${slug}`);
    }

    // Mayor portal: Map, Alerts, Home, Depts, Contrs
    await switchRole(page, "Nasir");
    const mayorNav = page.getByRole("navigation", { name: "Mayor portal sections" });
    await expect(mayorNav).toBeVisible();
    for (const [label, slug] of [
      ["Map", "map"],
      ["Alerts", "alerts"],
      ["Home", "home"],
      ["Depts", "depts"],
      ["Contrs", "contractors"],
    ] as const) {
      await mayorNav.getByRole("tab", { name: new RegExp(label) }).click();
      await assertNoOverflow(`mayor-${slug}`);
      await shot(page, `${width}-mayor-${slug}`);
    }
  });
}

// Leaflet panes/controls reach z-index ~1000, so every shadcn overlay surface must sit at ≥ 1100.
// Checked statically: no screen renders these primitives yet (first runtime check comes with T3.3).
test("overlays stack above Leaflet (z-index ≥ 1100)", () => {
  const minSurfaces: Record<string, number> = {
    "dialog.tsx": 2, // overlay + content
    "sheet.tsx": 2, // overlay + sheetVariants
    "dropdown-menu.tsx": 2, // Content + SubContent
    "sonner.tsx": 1, // Toaster
  };
  for (const [file, min] of Object.entries(minSurfaces)) {
    const src = readFileSync(path.join(__dirname, "../components/ui", file), "utf8");
    const high = [...src.matchAll(/\bz-\[(\d+)\]/g)].map((m) => Number(m[1])).filter((z) => z >= 1100);
    expect(high.length, `${file}: z-index classes ≥ 1100`).toBeGreaterThanOrEqual(min);
    expect(src, `${file}: leftover z-50`).not.toMatch(/\bz-50\b/);
  }
});
