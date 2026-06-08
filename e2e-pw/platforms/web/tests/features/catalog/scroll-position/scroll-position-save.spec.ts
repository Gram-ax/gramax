import { expect } from "@playwright/test";
import { buildContent, scrollTest } from "./scroll.fixture";

const ARTICLE_A_CONTENT = ["## Introduction", "", buildContent(30), "", "## Deep Section", "", buildContent(20)].join(
	"\n",
);

const ARTICLE_B_CONTENT = ["## Introduction", "", buildContent(50)].join("\n");

const ARTICLE_A = "/-/-/-/-/scroll-test/article-a";
const ARTICLE_B = "/-/-/-/-/scroll-test/article-b";

scrollTest.use({
	startUrl: ARTICLE_A,
	files: {
		"scroll-test": {
			"doc-root.yml": "title: Scroll Test\nsyntax: xml\n",
			"article-a.md": `---\ntitle: Article A\n---\n\n${ARTICLE_A_CONTENT}`,
			"article-b.md": `---\ntitle: Article B\n---\n\n${ARTICLE_B_CONTENT}`,
		},
	},
});

scrollTest.describe("Scroll position saving", () => {
	scrollTest(
		"should start at top when opening an article for the first time",
		async ({ catalogPage, getScrollTop }) => {
			await catalogPage.waitForLoad();
			const scrollTop = await getScrollTop();
			expect(scrollTop).toBe(0);
		},
	);

	scrollTest(
		"should restore scroll position when returning to an article",
		async ({ catalogPage, basePage, getScrollTop, setScrollTop }) => {
			await catalogPage.waitForLoad();

			const TARGET_SCROLL = 500;
			await setScrollTop(TARGET_SCROLL);

			const scrollAfterSet = await getScrollTop();
			expect(scrollAfterSet).toBe(TARGET_SCROLL);

			await basePage.navigate(ARTICLE_B);
			await basePage.navigate(ARTICLE_A);

			const restored = await getScrollTop();
			expect(restored).toBe(TARGET_SCROLL);
		},
	);

	scrollTest(
		"should not restore scroll position to another article",
		async ({ catalogPage, basePage, getScrollTop, setScrollTop }) => {
			await catalogPage.waitForLoad();

			await setScrollTop(500);

			await basePage.navigate(ARTICLE_B);
			const scrollTop = await getScrollTop();
			expect(scrollTop).toBe(0);
		},
	);
});
