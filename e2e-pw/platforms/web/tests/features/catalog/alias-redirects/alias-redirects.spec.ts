import { expect, type Locator } from "@playwright/test";
import { catalogTest } from "@web/fixtures/catalog.fixture";

const T1 = "2026-03-10T11:00:00Z";
const T2 = "2026-05-20T08:30:00Z";
const T3 = "2026-07-01T16:40:00Z";

catalogTest.use({
	files: {
		alias: {
			"doc-root.yml": "title: Alias\n",
			"target.md": `---
title: Target
aliases:
  - old-manual
  - { path: old-auto, moved: "${T2}" }
---

target body
`,
			sec: {
				"_index.md": `---
title: Sec
aliases:
  - old-sec
---

sec body
`,
				"inside.md": `---
title: Inside
---

inside body
`,
			},
			sec2: {
				"_index.md": `---
title: Sec2
aliases:
  - old-sec2
---

sec2 body
`,
			},
			"els.md": `---
title: Els
aliases:
  - sec2/former
---

els body
`,
			handbook: {
				"_index.md": `---
title: Handbook
aliases:
  - { path: guide, moved: "${T1}" }
  - { path: manual, moved: "${T3}" }
---

handbook body
`,
			},
			setup: {
				"install.md": `---
title: Install
aliases:
  - { path: manual/install, moved: "${T2}" }
---

install body
`,
			},
			"plain.md": `---
title: Plain
---

plain body
`,
		},
	},
	startUrl: "/-/-/-/-/alias/target",
});

const openArticleSettings = async (catalogPage: import("@web/pom/catalog.page").default, title: string) => {
	const page = catalogPage.raw;
	const navItem = page.locator('[data-qa^="catalog-navigation-article-link-level-"]', { hasText: title }).first();
	await navItem.hover();
	await navItem.getByTestId("article-actions").first().click();
	await page.getByRole("menuitem", { name: "Configure" }).click();
	const dialog = catalogPage.modal;
	await expect(dialog.getByText("Article settings")).toBeVisible();
	return dialog;
};

const aliasesInput = (dialog: Locator) => dialog.getByPlaceholder("e.g. guide/install");

catalogTest.describe("Alias redirects: resolve", () => {
	catalogTest("manual alias opens the moved article", async ({ catalogPage }) => {
		await catalogPage.goto("/-/-/-/-/alias/old-manual");
		await catalogPage.waitForLoad();
		await expect(catalogPage.raw.getByText("target body")).toBeVisible();
	});

	catalogTest("auto alias ({ path, moved }) opens the moved article", async ({ catalogPage }) => {
		await catalogPage.goto("/-/-/-/-/alias/old-auto");
		await catalogPage.waitForLoad();
		await expect(catalogPage.raw.getByText("target body")).toBeVisible();
	});

	catalogTest("section alias works as a prefix for its content", async ({ catalogPage }) => {
		await catalogPage.goto("/-/-/-/-/alias/old-sec/inside");
		await catalogPage.waitForLoad();
		await expect(catalogPage.raw.getByText("inside body")).toBeVisible();
	});

	catalogTest("section alias works as an exact hit for the section page", async ({ catalogPage }) => {
		await catalogPage.goto("/-/-/-/-/alias/old-sec");
		await catalogPage.waitForLoad();
		await expect(catalogPage.raw.getByText("sec body")).toBeVisible();
	});

	catalogTest("layered history: prefix rewrite feeds into an exact alias", async ({ catalogPage }) => {
		// els.md left sec2 after sec2 was renamed: old-sec2/former -> sec2/former -> els
		await catalogPage.goto("/-/-/-/-/alias/old-sec2/former");
		await catalogPage.waitForLoad();
		await expect(catalogPage.raw.getByText("els body")).toBeVisible();
	});

	catalogTest("chronological fallback restores an intermediate section name", async ({ catalogPage }) => {
		// guide -> manual (T1), install left at manual (T2), manual -> handbook (T3)
		await catalogPage.goto("/-/-/-/-/alias/guide/install");
		await catalogPage.waitForLoad();
		await expect(catalogPage.raw.getByText("install body")).toBeVisible();
	});

	catalogTest("path without an alias stays a 404", async ({ catalogPage }) => {
		await catalogPage.goto("/-/-/-/-/alias/no-such-path");
		await catalogPage.waitForLoad();
		await expect(catalogPage.raw.getByText("Article not found")).toBeVisible();
	});
});

catalogTest.describe("Alias redirects: article settings", () => {
	catalogTest("slug rename writes an alias and the old path keeps working", async ({ catalogPage }) => {
		const dialog = await openArticleSettings(catalogPage, "Plain");
		await catalogTest.step("rename the article slug", async () => {
			const urlInput = dialog.locator('[data-qa="URL"]');
			await urlInput.fill("plain-renamed");
			await dialog.getByRole("button", { name: "Save" }).click();
			await catalogPage.waitForLoad();
		});

		await catalogTest.step("old path resolves to the renamed article", async () => {
			await catalogPage.goto("/-/-/-/-/alias/plain");
			await catalogPage.waitForLoad();
			await expect(catalogPage.raw.getByText("plain body")).toBeVisible();
		});

		await catalogTest.step("the recorded alias is visible in article settings", async () => {
			const reopened = await openArticleSettings(catalogPage, "Plain");
			await expect(reopened.getByText("plain", { exact: true })).toBeVisible();
		});
	});

	catalogTest("manually added alias starts resolving", async ({ catalogPage }) => {
		const dialog = await openArticleSettings(catalogPage, "Plain");
		await aliasesInput(dialog).fill("hand-made");
		await aliasesInput(dialog).press("Enter");
		await dialog.getByRole("button", { name: "Save" }).click();
		await catalogPage.waitForLoad();

		await catalogPage.goto("/-/-/-/-/alias/hand-made");
		await catalogPage.waitForLoad();
		await expect(catalogPage.raw.getByText("plain body")).toBeVisible();
	});

	catalogTest("removing the last alias stops it from resolving", async ({ catalogPage }) => {
		// regression: react-hook-form treats onChange(undefined) as a reset to
		// defaultValues, which used to resurrect the last removed tag on save
		const dialog = await openArticleSettings(catalogPage, "Target");
		await catalogTest.step("remove both alias tags, the last one included", async () => {
			const removeTag = dialog.getByLabel("Delete");
			await removeTag.first().click();
			await removeTag.first().click();
			await expect(dialog.getByText("old-manual", { exact: true })).toBeHidden();
		});
		await dialog.getByRole("button", { name: "Save" }).click();
		await catalogPage.waitForLoad();

		await catalogPage.goto("/-/-/-/-/alias/old-manual");
		await catalogPage.waitForLoad();
		await expect(catalogPage.raw.getByText("Article not found")).toBeVisible();
	});

	catalogTest("auto alias is marked with an icon and a tooltip", async ({ catalogPage }) => {
		// only the { path, moved } entry gets the pencil-sparkles marker
		const dialog = await openArticleSettings(catalogPage, "Target");
		const autoTooltip = "Added automatically when moving or renaming the article or category";
		const autoMark = dialog.getByLabel(autoTooltip);
		await expect(autoMark).toHaveCount(1);
		await autoMark.hover();
		await expect(catalogPage.raw.getByRole("tooltip").getByText(autoTooltip)).toBeVisible();
	});

	catalogTest("clear-automatic button drops auto aliases and keeps manual ones", async ({ catalogPage }) => {
		// Target has old-manual (manual) and old-auto ({ path, moved }); the button
		// next to the field title must drop only the auto entry
		const dialog = await openArticleSettings(catalogPage, "Target");
		await dialog.getByRole("button", { name: "Clear automatically added paths" }).click();
		await expect(dialog.getByText("old-auto", { exact: true })).toBeHidden();
		await expect(dialog.getByText("old-manual", { exact: true })).toBeVisible();
		await dialog.getByRole("button", { name: "Save" }).click();
		await catalogPage.waitForLoad();

		await catalogPage.goto("/-/-/-/-/alias/old-auto");
		await catalogPage.waitForLoad();
		await expect(catalogPage.raw.getByText("Article not found")).toBeVisible();

		await catalogPage.goto("/-/-/-/-/alias/old-manual");
		await catalogPage.waitForLoad();
		await expect(catalogPage.raw.getByText("target body")).toBeVisible();
	});

	catalogTest("alias with invalid characters blocks saving", async ({ catalogPage }) => {
		const dialog = await openArticleSettings(catalogPage, "Plain");
		await aliasesInput(dialog).fill("bad path!");
		await aliasesInput(dialog).press("Enter");
		await dialog.getByRole("button", { name: "Save" }).click();
		// validation rejects the submit — the dialog stays open
		await expect(dialog.getByText("Article settings")).toBeVisible();
		await expect(dialog.getByText("bad path!")).toBeVisible();
	});
});
