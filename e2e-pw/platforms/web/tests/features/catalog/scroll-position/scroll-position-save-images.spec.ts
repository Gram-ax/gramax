import { expect } from "@playwright/test";
import { buildContent, scrollTest, TEST_IMAGE } from "./scroll.fixture";

const IMAGES_ARTICLE_CONTENT = [
	"## Introduction",
	"",
	buildContent(2),
	"",
	"![Screenshot 1](./photo.jpg){width=800px height=500px}",
	"",
	buildContent(2),
	"",
	"![Screenshot 2](./photo.jpg){width=800px height=500px}",
	"",
	buildContent(2),
	"",
	"![Screenshot 3](./photo.jpg){width=800px height=500px}",
	"",
	buildContent(5),
].join("\n");

const ARTICLE_WITH_IMAGES = "/-/-/-/-/scroll-images-test/article-with-images";
const ARTICLE_PLAIN = "/-/-/-/-/scroll-images-test/article-plain";

scrollTest.use({
	startUrl: ARTICLE_WITH_IMAGES,
	files: {
		"scroll-images-test": {
			"doc-root.yml": "title: Scroll Images Test\nsyntax: MarkdownIt\nsupportedLanguages: []\n",
			"article-with-images.md": `---\ntitle: Article With Images\n---\n\n${IMAGES_ARTICLE_CONTENT}`,
			"article-plain.md": `---\ntitle: Article Plain\n---\n\n${buildContent(5)}`,
			"photo.jpg": TEST_IMAGE,
		},
	},
});

scrollTest.describe("Scroll position saving with images", () => {
	scrollTest(
		"should start at top when opening an article with images for the first time",
		async ({ catalogPage, getScrollTop }) => {
			await catalogPage.waitForLoad();
			const scrollTop = await getScrollTop();
			expect(scrollTop).toBe(0);
		},
	);

	scrollTest(
		"should restore scroll position past an image when returning to the article",
		async ({ catalogPage, sharedPage, basePage, getScrollTop, setScrollTop }) => {
			await catalogPage.waitForLoad();

			// Wait for the image container to be rendered before scrolling
			await expect(sharedPage.locator(".image-container").first()).toBeVisible();

			// Scroll to a position below the first image (which renders at ~500px height)
			const TARGET_SCROLL = 800;
			await setScrollTop(TARGET_SCROLL);

			const scrollAfterSet = await getScrollTop();
			expect(scrollAfterSet).toBe(TARGET_SCROLL);

			await basePage.navigate(ARTICLE_PLAIN);
			await basePage.navigate(ARTICLE_WITH_IMAGES);

			await catalogPage.waitForLoad();
			await expect(sharedPage.locator(".image-container").first()).toBeVisible();

			const restored = await getScrollTop();
			expect(restored).toBe(scrollAfterSet);
		},
	);

	scrollTest(
		"should not carry over scroll position from an article with images to a different article",
		async ({ catalogPage, sharedPage, basePage, getScrollTop, setScrollTop }) => {
			await catalogPage.waitForLoad();

			await expect(sharedPage.locator(".image-container").first()).toBeVisible();
			await setScrollTop(800);

			await basePage.navigate(ARTICLE_PLAIN);
			const scrollTop = await getScrollTop();
			expect(scrollTop).toBe(0);
		},
	);

	scrollTest(
		"should not jump scroll position when images finish loading",
		async ({ catalogPage, sharedPage, basePage, getScrollTop, setScrollTop }) => {
			await catalogPage.waitForLoad();

			// Scroll past the image, navigate away and back. On return the article
			// renders before images load — verify the MutationObserver retry lands
			// at the correct position and overflow-anchor: none prevents a jump.
			await expect(sharedPage.locator(".image-container").first()).toBeVisible();
			const TARGET_SCROLL = 800;
			await setScrollTop(TARGET_SCROLL);
			const scrollAfterSet = await getScrollTop();

			await basePage.navigate(ARTICLE_PLAIN);
			await basePage.navigate(ARTICLE_WITH_IMAGES);

			// Wait for images to finish loading and all retries to settle
			await expect(sharedPage.locator(".image-container img").first()).toBeVisible();

			const finalScroll = await getScrollTop();
			expect(finalScroll).toBe(scrollAfterSet);
		},
	);
});
