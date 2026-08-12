import type { WorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { expect, type Page } from "@playwright/test";
import { getSourceDataFromEnv, getTestRepoInfoFromEnv } from "@utils/source";
import { homeTest as test } from "@web/fixtures/home.fixture";

test.use({});

const source = getSourceDataFromEnv();
const repo = getTestRepoInfoFromEnv();

const CATALOG_BUTTON = "No Index";
const LFS_TEST_PATTERN = "*.e2e-lfs-test";

const setWorkspaceLfsPatterns = async (page: Page, patterns: string[] | null) => {
	await page.evaluate(async (patterns) => {
		const app = await window.app!;
		const workspace = app.wm.current();
		const workspaceConfig = app.wm.getWorkspaceConfig(workspace.path())?.config;
		if (!workspaceConfig) throw new Error("Workspace config is not available");
		const currentConfig = workspaceConfig.inner();

		const git = patterns ? { ...(currentConfig.git ?? {}), lfs: { patterns } } : undefined;
		workspaceConfig.update({
			...currentConfig,
			git,
		} satisfies WorkspaceConfig);
		await workspaceConfig.save();
	}, patterns);
};

const getSyncButton = (page: Page) => {
	const statusBar = page
		.locator('[data-qa="qa-status-bar"] .status-bar')
		.filter({ has: page.locator(".sync-icons:has(svg.lucide-refresh-cw)") })
		.first();
	return statusBar.locator(".sync-icons:has(svg.lucide-refresh-cw)");
};

test.describe
	.serial("lfs migration", () => {
		test("clone", async ({ homePage, sharedPage }) => {
			await sharedPage.getByTestId("add-catalog").click();

			await sharedPage.getByRole("menuitem", { name: "Load existing" }).click();

			await sharedPage.getByRole("combobox").click();
			await sharedPage.getByRole("option", { name: "GitLab" }).click();
			await homePage.waitForLoad();

			await sharedPage.getByRole("textbox", { name: "GitLab Server URL" }).fill(source.domain);

			await sharedPage.getByRole("textbox", { name: "GitLab Token" }).click();
			await sharedPage.getByRole("textbox", { name: "GitLab Token" }).fill(source.token);

			await homePage.waitForLoad();

			await expect(sharedPage.getByRole("textbox", { name: "Email" })).toHaveValue(source.userEmail);

			await sharedPage.getByRole("button", { name: "Add" }).click();
			await sharedPage.getByRole("combobox", { name: "Repository" }).click();

			await sharedPage.getByPlaceholder("Find").fill(repo.testRepoNoIndex);
			await homePage.waitForLoad();

			await sharedPage
				.getByRole("option", { name: `${repo.group}/${repo.testRepoNoIndex}` })
				.click({ timeout: 15_000 });

			await sharedPage.getByRole("button", { name: "Load" }).click();

			await homePage.waitForLoad(1000);

			await sharedPage.getByRole("button", { name: CATALOG_BUTTON }).click();

			await homePage.waitForLoad(1000);
		});

		test("sync without divergence shows no modal", async ({ basePage }) => {
			const page = basePage.raw;

			await page.getByRole("button", { name: CATALOG_BUTTON }).click();
			await basePage.waitForLoad();

			await getSyncButton(page).click();
			await basePage.waitForLoad();

			await basePage.assertNoModal();
			await expect(page.getByRole("alertdialog")).toBeHidden();
		});

		test("diverged patterns show modal with details, cancel applies nothing", async ({ basePage }) => {
			const page = basePage.raw;

			await page.getByRole("button", { name: CATALOG_BUTTON }).click();
			await basePage.waitForLoad();

			await setWorkspaceLfsPatterns(page, [LFS_TEST_PATTERN]);

			await getSyncButton(page).click();

			const dialog = page.getByRole("alertdialog");
			await expect(dialog).toBeVisible({ timeout: 30_000 });
			await expect(dialog.getByText("Files need to be moved to new storage")).toBeVisible();

			await dialog.getByText("Technical details").click();
			await expect(dialog.getByText(LFS_TEST_PATTERN, { exact: true })).toBeVisible();

			await dialog.getByRole("button", { name: "Remind me later" }).click();
			await expect(dialog).toBeHidden();
		});

		test("divergence is re-detected on next sync after cancel", async ({ basePage }) => {
			const page = basePage.raw;

			await page.getByRole("button", { name: CATALOG_BUTTON }).click();
			await basePage.waitForLoad();

			await getSyncButton(page).click();

			const dialog = page.getByRole("alertdialog");
			await expect(dialog).toBeVisible({ timeout: 30_000 });
			await expect(dialog.getByText("Files need to be moved to new storage")).toBeVisible();

			await dialog.getByRole("button", { name: "Remind me later" }).click();
			await expect(dialog).toBeHidden();

			await setWorkspaceLfsPatterns(page, null);
		});
	});
