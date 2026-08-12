import { expect } from "@playwright/test";
import { catalogTest } from "@web/fixtures/catalog.fixture";
import { ArticleEditorPom } from "@web/pom/editor.pom";

// Repro for CI failure: article/resource/set "article not found: <catalog>/docs/content/new_article_2/_index.md"
// after setMarkdown + Mermaid insert into a folder article inside a docroot catalog.

catalogTest.use({
	startUrl: "/repro-docroot/content/new_article_2",
	files: {
		"repro-docroot": {
			docs: {
				"doc-root.yml": "title: Repro Docroot\n",
				content: {
					new_article_2: {
						"_index.md": "---\ntitle: Block nodes\n---\n\nstub",
						"child.md": "---\ntitle: Child\n---\n\nchild",
					},
				},
			},
		},
	},
});

catalogTest("mermaid insert into docroot folder article", async ({ basePage, catalogPage, sharedPage }) => {
	await basePage.waitForLoad();

	const editor = new ArticleEditorPom(catalogPage);
	await editor.setMarkdown("(*)");
	await editor.focus();

	await editor.clickToolbar("semiBlocks");
	await sharedPage.getByRole("menuitem", { name: "Mermaid" }).click();
	await basePage.waitForLoad();

	await expect(sharedPage.locator(".node-diagrams").first()).toBeVisible();
	await basePage.assertNoModal();

	// The article file must keep its name: opening an article whose folder matches
	// NEW_ARTICLE_REGEX must not silently rename it to the title slug.
	expect(sharedPage.url()).toContain("new_article_2");
});
