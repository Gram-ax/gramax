import { expect, type Locator, type Page } from "@playwright/test";
import { getSourceDataFromEnv, getTestRepoInfoFromEnv } from "@utils/source";
import { homeTest as test } from "@web/fixtures/home.fixture";
import CatalogPage from "@web/pom/catalog.page";
import { ArticleEditorPom } from "@web/pom/editor.pom";

const source = getSourceDataFromEnv();
const repo = getTestRepoInfoFromEnv();

const CATALOG = repo.testRepo; // "test-catalog"
// Cloned catalogs use the long git URL form: /<host>/<group>/<repo>/<branch>/-/<article>
const HOST = repo.domain.replace(/^https?:\/\//, ""); // "gitlab.com"
const CATALOG_BASE = `/${HOST}/${repo.group}/${CATALOG}/master/-`;
const COMMENT_ARTICLE = `${CATALOG_BASE}/comments/local`;
const COMMENT_BODY = "Комментарий тест.";

/** Inline commented text: click to open the comment popover. */
const inlineComment = (page: Page): Locator => page.locator("span[data-comment-id]").first();

/** Comment popover (tippy tooltip) is appended to the editor and renders the Comment component + comment-editor input. */
const commentPopover = (page: Page): Locator =>
	page.locator(".tippy-box", { has: page.getByTestId("comment-editor") }).first();

const commentEditorInput = (page: Page): Locator => page.getByTestId("comment-editor").first();

/** Comment button inside the inline selection toolbar (lucide-message-square icon; click the button, not the svg). */
const inlineToolbarCommentButton = (page: Page): Locator =>
	page
		.locator('[role="article-inline-toolbar"]')
		.locator("button", { has: page.locator("svg.lucide-message-square") })
		.first();

const openArticleEditor = (sharedPage: Page, baseURL: string) => {
	const catalogPage = new CatalogPage(sharedPage, baseURL);
	const editor = new ArticleEditorPom(catalogPage);
	return { catalogPage, editor };
};

test.describe
	.serial("Comments", () => {
		test("clone test-catalog", async ({ homePage, sharedPage }) => {
			await sharedPage.getByTestId("add-catalog").click();

			await sharedPage.getByRole("menuitem", { name: "Load existing" }).click();

			const serverUrl = sharedPage.getByRole("textbox", { name: "GitLab Server URL" });
			await expect(async () => {
				await sharedPage.getByRole("combobox").click();
				await sharedPage.getByRole("option", { name: "GitLab" }).click({ force: true });
				await expect(serverUrl).toBeVisible({ timeout: 2000 });
			}).toPass({ timeout: 20_000 });

			await serverUrl.fill(source.domain);

			await sharedPage.getByRole("textbox", { name: "GitLab Token" }).click();
			await sharedPage.getByRole("textbox", { name: "GitLab Token" }).fill(source.token);

			await expect(sharedPage.getByRole("textbox", { name: "Email" })).toHaveValue(source.userEmail);

			await sharedPage.getByRole("button", { name: "Add" }).click();
			await sharedPage.getByRole("combobox", { name: "Repository" }).click();

			await sharedPage.getByPlaceholder("Find").fill("test-catalog");
			await homePage.waitForLoad();

			await sharedPage.getByRole("option", { name: `${repo.group}/${repo.testRepo}` }).click({ timeout: 15_000 });

			await sharedPage.getByRole("button", { name: "Load" }).click();

			await homePage.waitForLoad(1000);

			await sharedPage.getByRole("button", { name: "Автотест" }).click();

			await homePage.waitForLoad(1000);

			await sharedPage.getByRole("link", { name: "Автотест" }).click();
		});

		test("opens the comment popover", async ({ basePage, sharedPage }) => {
			await basePage.navigate(COMMENT_ARTICLE);
			await basePage.waitForLoad();

			await inlineComment(sharedPage).click();

			await expect(commentPopover(sharedPage)).toBeVisible();
			await expect(commentPopover(sharedPage).getByText(COMMENT_BODY)).toBeVisible();

			await sharedPage.keyboard.press("Escape");
			await expect(commentEditorInput(sharedPage)).toBeHidden();
		});

		test("copies a comment within the current article", async ({ basePage, sharedPage, baseURL }) => {
			await basePage.navigate(COMMENT_ARTICLE);
			await basePage.waitForLoad();

			const { editor } = openArticleEditor(sharedPage, baseURL!);
			await editor.setMarkdown("[comment:1]Текст статьи.[/comment](*)");
			await editor.focus();

			await editor.press("ControlOrMeta+A ControlOrMeta+C");
			await editor.press("ArrowDown Enter ControlOrMeta+V");

			await editor.assertMarkdownContains(
				/\[comment:1\]Текст статьи\.\[\/comment\]\s+\[comment:[^\]]+\]Текст статьи\.\[\/comment\]/,
			);
		});

		test("copies a comment into another article", async ({ basePage, sharedPage, baseURL }) => {
			// Seed a commented paragraph and copy it in the source article.
			await basePage.navigate(COMMENT_ARTICLE);
			await basePage.waitForLoad();

			const source = openArticleEditor(sharedPage, baseURL!);
			await source.editor.setMarkdown("[comment:1]Текст статьи.[/comment](*)");
			await source.editor.focus();
			await source.editor.press("ControlOrMeta+A ControlOrMeta+C");

			// Move to a different, cleared article and paste.
			await basePage.navigate(`${CATALOG_BASE}/comments/server`);
			await basePage.waitForLoad();

			const { catalogPage, editor } = openArticleEditor(sharedPage, baseURL!);
			await editor.setMarkdown("(*)");
			await editor.focus();
			await editor.press("ControlOrMeta+V");

			// Pasted into another article: comment is restored under a new id, text preserved.
			await editor.assertMarkdownContains(/\[comment:[^\]]+\]Текст статьи\.\[\/comment\]/);

			await catalogPage.raw.getByText("Текст статьи.").click();
			await expect(commentPopover(sharedPage).getByText(COMMENT_BODY)).toBeVisible();
		});

		test("adds a comment to a text selection", async ({ basePage, sharedPage, baseURL }) => {
			await basePage.navigate(`${CATALOG_BASE}/content/new_article_5`);
			await basePage.waitForLoad();

			const urlBeforeCreate = sharedPage.url();
			const createArticleButton = sharedPage.getByTestId("create-article").last();
			await createArticleButton.click();

			await sharedPage.waitForURL((url) => url.toString() !== urlBeforeCreate, { timeout: 15_000 });
			await basePage.waitForLoad();

			const { editor } = openArticleEditor(sharedPage, baseURL!);
			await editor.setMarkdown("Текст для комментария(*)");
			await editor.focus();
			await editor.press("ControlOrMeta+A");
			await inlineToolbarCommentButton(sharedPage).click();

			await commentEditorInput(sharedPage).click();
			await sharedPage.keyboard.type("комментарий");
			await sharedPage.keyboard.press("ControlOrMeta+Enter");

			await editor.press("Home");
			await inlineComment(sharedPage).click();
			await expect(commentPopover(sharedPage).getByText("комментарий")).toBeVisible();
		});

		test("adds a comment to a diagram block", async ({ basePage, sharedPage, baseURL }) => {
			await basePage.navigate(`${CATALOG_BASE}/content/block-nodes`);
			await basePage.waitForLoad();

			const { editor } = openArticleEditor(sharedPage, baseURL!);
			await editor.setMarkdown("(*)");
			await editor.focus();

			await editor.clickToolbar("semiBlocks");
			await sharedPage.getByRole("menuitem", { name: "Mermaid" }).click();
			await basePage.waitForLoad();

			const block = sharedPage.locator(".node-diagrams").first();
			await block.hover();
			const nodeActions = block.locator('[data-qa="qa-node-actions"]');
			await nodeActions.hover();
			await nodeActions.locator("div:has(> i > svg.lucide-message-square)").click();

			await commentEditorInput(sharedPage).click();
			await sharedPage.keyboard.type("комментарий");
			await sharedPage.keyboard.press("ControlOrMeta+Enter");

			await block.hover();
			const newNodeActions = block.locator('[data-qa="qa-node-actions"]');
			await newNodeActions.hover();
			await newNodeActions.locator("div:has(> i > svg.lucide-message-square-text)").click();
			await expect(commentPopover(sharedPage).getByText("комментарий")).toBeVisible();
		});
	});
