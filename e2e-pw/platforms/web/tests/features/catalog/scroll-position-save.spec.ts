import { expect, type Page } from "@playwright/test";
import { catalogTest } from "@web/fixtures/catalog.fixture";

const PARAGRAPH =
	"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation.";

const buildContent = (paragraphs: number) =>
	Array.from({ length: paragraphs }, (_, i) => `Paragraph ${i + 1}: ${PARAGRAPH}`).join("\n\n");

const ARTICLE_A_CONTENT = ["## Introduction", "", buildContent(30), "", "## Deep Section", "", buildContent(20)].join(
	"\n",
);

const ARTICLE_B_CONTENT = ["## Introduction", "", buildContent(50)].join("\n");

const getScrollTop = (page: Page): Promise<number> =>
	page.getByTestId("article-scroll-container").evaluate((el: HTMLElement) => el.scrollTop);

const setScrollTop = (page: Page, value: number): Promise<void> =>
	page.getByTestId("article-scroll-container").evaluate((el: HTMLElement, v: number) => {
		el.scrollTop = v;
	}, value);

const ARTICLE_A = "/-/-/-/-/scroll-test/article-a";
const ARTICLE_B = "/-/-/-/-/scroll-test/article-b";

catalogTest.use({
	startUrl: ARTICLE_A,
	files: {
		"scroll-test": {
			"doc-root.yml": "title: Scroll Test\nsyntax: xml\n",
			"article-a.md": `---\ntitle: Article A\n---\n\n${ARTICLE_A_CONTENT}`,
			"article-b.md": `---\ntitle: Article B\n---\n\n${ARTICLE_B_CONTENT}`,
		},
	},
});

catalogTest.describe("Scroll position saving", () => {
	catalogTest(
		"should start at top when opening an article for the first time",
		async ({ catalogPage, sharedPage }) => {
			await catalogPage.waitForLoad();
			const scrollTop = await getScrollTop(sharedPage);
			expect(scrollTop).toBe(0);
		},
	);

	catalogTest(
		"should restore scroll position when returning to an article",
		async ({ catalogPage, sharedPage, basePage }) => {
			await catalogPage.waitForLoad();

			const TARGET_SCROLL = 500;
			await setScrollTop(sharedPage, TARGET_SCROLL);

			const scrollAfterSet = await getScrollTop(sharedPage);
			expect(scrollAfterSet).toBe(TARGET_SCROLL);

			// should start at top
			await basePage.navigate(ARTICLE_B);

			await basePage.navigate(ARTICLE_A);

			const restored = await getScrollTop(sharedPage);
			expect(restored).toBe(TARGET_SCROLL);
		},
	);

	catalogTest(
		"should not restore scroll position to another article",
		async ({ catalogPage, sharedPage, basePage }) => {
			await catalogPage.waitForLoad();

			await setScrollTop(sharedPage, 500);

			await basePage.navigate(ARTICLE_B);
			const scrollTop = await getScrollTop(sharedPage);
			expect(scrollTop).toBe(0);
		},
	);
});
