import { editorTest } from "@web/fixtures/editor.fixture";
import { expect, type Page } from "playwright/test";

/**
 * What an OpenAPI block looks like on paper.
 *
 * The PDF export paginates its own copy of the article: it measures every top-level node and lifts it into
 * fixed-height page boxes that clip. An OpenAPI block is far taller than a page, so it is the one block that
 * gets dealt out across pages, and everything asserted below is about surviving that.
 *
 * Runnable at all only because `NO_PRINT` (set for every run in base.fixture) stops the export just before
 * `window.print()`: the browser's dialog is modal and would hang the worker, while the paginated pages stay
 * in the document for these assertions.
 */
editorTest.beforeEach(async ({ basePage }) => {
	await basePage.waitForLoad();
});

// The preview is a bottom view that outlives the test unless dismissed -- nothing reloads the page between
// scenarios in a worker. Left standing, the next test's `setMarkdown` runs against a document the export is
// still rewriting, and dies with "execution context was destroyed" long before its own assertions.
editorTest.afterEach(async ({ sharedPage }) => {
	const close = sharedPage.locator(".print-debug-close");
	if (await close.count()) await close.click();
	await expect(sharedPage.locator(".print-body")).toHaveCount(0);
});

const exportCatalogToPdf = async (sharedPage: Page) => {
	await sharedPage.getByTestId("catalog-actions").click();
	await sharedPage.getByRole("menuitem", { name: /Export/i }).click();
	await sharedPage.getByRole("menuitem", { name: /Catalog to PDF/i }).click();
	await sharedPage.getByRole("button", { name: /Open print dialog/i }).click();
};

editorTest.describe("OpenApi in the PDF export", () => {
	editorTest("pages end up on screen, not merely in the document", async ({ editor, sharedPage }) => {
		await editor.clickToolbar("semiBlocks");
		await sharedPage.getByRole("menuitem", { name: "OpenAPI" }).click();
		await expect(sharedPage.locator('[data-testid="open-api"]')).toBeVisible();

		await exportCatalogToPdf(sharedPage);

		await expect(sharedPage.locator(".print-body")).toBeVisible({ timeout: 60_000 });
		await expect(sharedPage.locator(".print-body .page").first()).toBeVisible();

		// Everything above is satisfied by an element that owns a box and is not `visibility: hidden`, and
		// says nothing about an ancestor clipping it away. That is exactly how this broke once: the preview
		// sat in the flow as a flex item of an article column with no height left over, so its own overflow
		// cut all 1350px of every page out of sight -- the screen showed nothing while every locator here
		// still reported "visible". A second thing did the same from the front: the export dialog's overlay
		// stayed behind, covering the preview, because only the print stylesheet takes it away.
		// Hit-testing separates the two readings: whatever paints at a point has to be the preview itself.
		const paintedAt = await sharedPage.evaluate(() => {
			const probe = (el: Element | null, dx: number, dy: number) => {
				if (!el) return "missing";
				const rect = el.getBoundingClientRect();
				const hit = document.elementFromPoint(
					Math.min(Math.max(rect.x + dx, 1), window.innerWidth - 1),
					Math.min(Math.max(rect.y + dy, 1), window.innerHeight - 1),
				);
				if (!hit) return "nothing";
				return hit.closest(".print-debug-preview") ? "preview" : `covered by ${hit.tagName.toLowerCase()}`;
			};

			return {
				page: probe(document.querySelector(".print-body .page"), 40, 40),
				closeButton: probe(document.querySelector(".print-debug-close"), 16, 16),
			};
		});

		expect(paintedAt).toEqual({ page: "preview", closeButton: "preview" });
	});

	editorTest("every operation prints as its heading alone", async ({ editor, sharedPage }) => {
		await editor.clickToolbar("semiBlocks");
		await sharedPage.getByRole("menuitem", { name: "OpenAPI" }).click();
		await expect(sharedPage.locator('[data-testid="open-api"]')).toBeVisible();

		await exportCatalogToPdf(sharedPage);
		await expect(sharedPage.locator(".print-body")).toBeVisible({ timeout: 60_000 });

		// The list of operations is the point of the printed page, so the headings are there...
		await expect(sharedPage.locator(".print-body api-operation").first()).toBeVisible();
		// ...while the bodies are not: a card printed open runs over several pages of parameters nobody asked for.
		const openBodies = await sharedPage
			.locator(".print-body .op-body")
			.evaluateAll((nodes) => nodes.filter((node) => getComputedStyle(node).display !== "none").length);
		expect(openBodies).toBe(0);

		// Nor is the search field: an empty input is noise on paper. It reaches the page at all only because
		// the element's own print mode -- which would drop it -- is switched off in OpenApiViewer.
		const visibleSearch = await sharedPage
			.locator(".print-body .search-field")
			.evaluateAll((nodes) => nodes.filter((node) => getComputedStyle(node).display !== "none").length);
		expect(visibleSearch).toBe(0);
	});

	editorTest("cards carry no shadow the page edge could slice", async ({ editor, sharedPage }) => {
		await editor.clickToolbar("semiBlocks");
		await sharedPage.getByRole("menuitem", { name: "OpenAPI" }).click();
		await expect(sharedPage.locator('[data-testid="open-api"]')).toBeVisible();

		await exportCatalogToPdf(sharedPage);
		await expect(sharedPage.locator(".print-body")).toBeVisible({ timeout: 60_000 });

		// A card sits flush against its page, and the page clips (`overflow: hidden`). A shadow there cannot
		// fade out: it is cut into a hard line down the side of the card and squares off the corner it crosses
		// -- the "second, misaligned border" a reader reports. On screen the same cards keep their shadow.
		const [inPrint, onScreen] = await Promise.all([
			sharedPage
				.locator(".print-body .op-card")
				.evaluateAll((cards) => cards.filter((card) => getComputedStyle(card).boxShadow !== "none").length),
			sharedPage
				.locator('[data-testid="open-api"] .op-card')
				.evaluateAll((cards) => cards.filter((card) => getComputedStyle(card).boxShadow !== "none").length),
		]);

		expect(inPrint).toBe(0);
		expect(onScreen).toBeGreaterThan(0);
	});

	editorTest("card outlines survive the print stylesheet", async ({ editor, sharedPage }) => {
		await editor.clickToolbar("semiBlocks");
		await sharedPage.getByRole("menuitem", { name: "OpenAPI" }).click();
		await expect(sharedPage.locator('[data-testid="open-api"]')).toBeVisible();

		await exportCatalogToPdf(sharedPage);
		await expect(sharedPage.locator(".print-body")).toBeVisible({ timeout: 60_000 });

		try {
			// Everything else here runs under screen media, where the export merely reproduces the print DOM.
			// This one needs the print stylesheet itself, because that is what breaks the outline.
			await sharedPage.emulateMedia({ media: "print" });

			// A card rounds its corners by clipping: the head inside it is a square box carrying its own
			// background, painted straight across the rounded border. Printing blankets the layout with
			// `* { overflow: visible }`, which suits scroll containers and strips exactly the clip the corners
			// depend on -- so on paper each corner came out as a break in the outline.
			// Every bordered card in the package, not only the operation one: they are built identically, so
			// a fix that named just one would leave the schemas printing wrong.
			const clipping = await sharedPage
				.locator(".print-body :is(.op-card, .model-card, .diagnostics-group)")
				.evaluateAll((cards) =>
					cards.map(
						(card) => `${card.className.toString().split(" ")[0]}:${getComputedStyle(card).overflow}`,
					),
				);

			expect(clipping.length).toBeGreaterThan(0);
			expect(clipping.filter((value) => !value.includes(":hidden"))).toEqual([]);
		} finally {
			// Media emulation outlives the test -- the page is shared by the whole worker.
			await sharedPage.emulateMedia({ media: null });
		}
	});

	editorTest("the debug preview can be dismissed", async ({ editor, sharedPage }) => {
		await editor.clickToolbar("semiBlocks");
		await sharedPage.getByRole("menuitem", { name: "OpenAPI" }).click();
		await expect(sharedPage.locator('[data-testid="open-api"]')).toBeVisible();

		await exportCatalogToPdf(sharedPage);
		await expect(sharedPage.locator(".print-body")).toBeVisible({ timeout: 60_000 });

		await sharedPage.locator(".print-debug-close").click();

		await expect(sharedPage.locator(".print-body")).toHaveCount(0);
		await expect(sharedPage.locator('[data-testid="open-api"]')).toBeVisible();
	});
});
