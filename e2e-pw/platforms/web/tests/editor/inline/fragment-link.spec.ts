import { expect } from "@playwright/test";
import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

const FRAGMENT_ID = "my-fragment";
const FRAGMENT_TITLE = "My Fragment";
const FRAGMENT_TEXT = "fragment content";

type FragmentFixture = {
	applyFragmentLink: null;
	typeAndSelect: null;
};

const fragmentTest = editorTest.extend<FragmentFixture>({
	files: {
		editor: {
			"new-article.md": "",
			"doc-root.yml": md`syntax: xml`,
			".gramax": {
				fragments: {
					[`${FRAGMENT_ID}.md`]: md`
						---
						title: ${FRAGMENT_TITLE}
						---

						${FRAGMENT_TEXT}
					`,
				},
			},
		},
	},

	typeAndSelect: async ({ editor }, use) => {
		await editor.type("Hello");
		await editor.press("ControlOrMeta+Shift+ArrowLeft");
		await use(null);
	},

	applyFragmentLink: async ({ catalogPage, typeAndSelect: _ }, use) => {
		const inlineToolbar = catalogPage.raw.locator('[role="article-inline-toolbar"]');
		await expect(inlineToolbar).toBeVisible();
		await inlineToolbar.locator('[data-qa="fragment-link-button"]').click();

		const listItem = catalogPage.raw.locator('[data-slot="command-item"]', { hasText: FRAGMENT_TITLE });
		await expect(listItem).toBeVisible();
		await listItem.click();
		await expect(catalogPage.raw.locator('[data-slot="command-item"]')).not.toBeVisible();

		await use(null);
	},
});

fragmentTest.describe("Fragment-link", () => {
	fragmentTest("select word and apply fragment-link via inline toolbar", async ({ applyFragmentLink: _, editor }) => {
		await editor.assertMarkdownContains(`<fragment-link id="${FRAGMENT_ID}">Hello</fragment-link>`);
	});

	fragmentTest(
		"unset fragment-link by clicking active button",
		async ({ applyFragmentLink: _, editor, catalogPage }) => {
			await editor.assertMarkdownContains(`<fragment-link id="${FRAGMENT_ID}">Hello</fragment-link>`);
			// Re-select to show toolbar with active button
			await editor.press("End");
			await editor.press("ControlOrMeta+Shift+ArrowLeft");
			const inlineToolbar = catalogPage.raw.locator('[role="article-inline-toolbar"]');
			await expect(inlineToolbar).toBeVisible();
			await inlineToolbar.locator('[data-qa="fragment-link-button"]').click();
			await editor.assertMarkdown("Hello");
		},
	);

	fragmentTest(
		"apply fragment-link then reload — mark is preserved",
		async ({ applyFragmentLink: _, editor, catalogPage, sharedPage }) => {
			await editor.forceSave();

			await sharedPage.reload({ waitUntil: "domcontentloaded" });
			await catalogPage.waitForLoad();

			await editor.assertMarkdownContains(`<fragment-link id="${FRAGMENT_ID}">Hello</fragment-link>`);
		},
	);

	fragmentTest(
		"hover over fragment-link shows fragment content in tooltip",
		async ({ applyFragmentLink: _, editor, catalogPage }) => {
			// Deselect so the inline toolbar is gone and hover works
			await editor.press("End");

			const fragmentLinkMark = catalogPage.raw.locator("span.fragment-link-mark");
			// First hover triggers the plugin to create and mount the tooltip component (React async)
			await fragmentLinkMark.hover();
			// Wait for React to mount and attach its mousemove listener
			await catalogPage.raw.waitForTimeout(200);
			// Second hover triggers mousemove → starts the 500ms open debounce → isVisible=true
			await fragmentLinkMark.hover();

			const tooltip = catalogPage.raw.locator(".tooltip-article");
			await expect(tooltip).toBeVisible({ timeout: 5000 });
			await expect(tooltip).toContainText(FRAGMENT_TEXT);
		},
	);

	fragmentTest("fragment-link button is not shown with no selection", async ({ editor, catalogPage }) => {
		await editor.type("Hello");

		// Move cursor to middle (no selection)
		await editor.press("Home");
		await editor.press("ArrowRight");

		const inlineToolbar = catalogPage.raw.locator('[role="article-inline-toolbar"]');
		await expect(inlineToolbar).not.toBeVisible();
	});

	fragmentTest("pressing space after fragment-link unsets mark", async ({ applyFragmentLink: _, editor }) => {
		// Move to end of marked text then press space
		await editor.press("End");
		await editor.press("Space");

		// Text after space should not be inside fragment-link
		await editor.type("world");
		await editor.assertMarkdownContains(`<fragment-link id="${FRAGMENT_ID}">Hello</fragment-link> world`);
	});
});
