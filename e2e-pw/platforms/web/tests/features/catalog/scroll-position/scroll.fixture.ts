import { expect } from "@playwright/test";
import { catalogTest } from "@web/fixtures/catalog.fixture";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

export const PARAGRAPH =
	"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation.";

export const buildContent = (paragraphs: number) =>
	Array.from({ length: paragraphs }, (_, i) => `Paragraph ${i + 1}: ${PARAGRAPH}`).join("\n\n");

const TEST_IMAGE_PATH = new URL("./image.jpg", import.meta.url);
export const TEST_IMAGE: number[] = Array.from(readFileSync(fileURLToPath(TEST_IMAGE_PATH)));

export type ScrollFixture = {
	getScrollTop: () => Promise<number>;
	setScrollTop: (value: number) => Promise<void>;
	waitForImagesLoaded: () => Promise<void>;
};

export const scrollTest = catalogTest.extend<ScrollFixture>({
	getScrollTop: async ({ sharedPage }, use) => {
		await use(() => sharedPage.getByTestId("article-scroll-container").evaluate((el: HTMLElement) => el.scrollTop));
	},

	setScrollTop: async ({ sharedPage }, use) => {
		await use((value: number) =>
			sharedPage.getByTestId("article-scroll-container").evaluate((el: HTMLElement, v: number) => {
				el.scrollTop = v;
			}, value),
		);
	},

	// Resolves once every article image has decoded and contributes its real height — the
	// point at which a saved pixel offset maps back to the same content.
	waitForImagesLoaded: async ({ sharedPage }, use) => {
		await use(async () => {
			await expect
				.poll(
					() =>
						sharedPage
							.locator(".image-container img")
							.evaluateAll(
								(imgs) =>
									imgs.length > 0 &&
									imgs.every((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
							),
					{ timeout: 10_000 },
				)
				.toBe(true);
		});
	},
});
