import { expect, type Locator, type Page } from "@playwright/test";
import { catalogTest } from "@web/fixtures/catalog.fixture";

const MOCK_GROUPS = {
	"group-editors": { name: "Editors", members: [] },
	"group-reviewers": { name: "Reviewers", members: [] },
};

const MOCK_USERS = [
	{ name: "Alice Smith", email: "alice@test.com" },
	{ name: "Bob Jones", email: "bob@test.com" },
];

export interface ArticleNotifications {
	state?: string;
	groups?: string[];
	users?: string[];
}

export interface EnterpriseFixture {
	enterprisePage: Page;
	editMenu: Locator;
	notificationDialog: Locator;
	openNotificationDialog: () => Promise<Locator>;
	getArticleNotifications: () => Promise<ArticleNotifications | null>;
	setArticleNotifications: (notifications: ArticleNotifications) => Promise<void>;
	selectGroup: (name: string) => Promise<void>;
	selectUser: (email: string) => Promise<void>;
}

export const notificationsTest = catalogTest.extend<EnterpriseFixture>({
	enterprisePage: async ({ sharedPage }, use) => {
		await sharedPage.evaluate(async () => {
			const app = await window.app!;
			await app.em.setGesUrl("http://mock-ges.local");
		});

		await sharedPage.evaluate(async () => {
			await window.debug.setSourceData({
				sourceType: "GitLab",
				userName: "test-user",
				userEmail: "test@test.com",
				domain: "mock-ges.local",
				token: "mock-token-123",
			} as Parameters<typeof window.debug.setSourceData>[0]);
		});

		await sharedPage.route("**/enterprise/config/groups/get**", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(MOCK_GROUPS),
			});
		});

		await sharedPage.route("**/sso/connectors/getUsers**", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(MOCK_USERS),
			});
		});

		await sharedPage.reload({ waitUntil: "domcontentloaded" });
		await sharedPage.waitForTimeout(1000);

		await use(sharedPage);

		await sharedPage.unroute("**/enterprise/config/groups/get**");
		await sharedPage.unroute("**/sso/connectors/getUsers**");
		await sharedPage.evaluate(async () => {
			const app = await window.app!;
			await app.em.clearGesUrl();
		});
	},

	editMenu: async ({ enterprisePage }, use) => {
		const articleItem = enterprisePage.locator('[data-qa="catalog-navigation-article-link-level-0"]').first();
		await articleItem.hover();
		await articleItem.locator(".right-extensions button").first().click();
		const dropdownContent = enterprisePage.getByTestId("dropdown-content");
		await expect(dropdownContent).toBeVisible();

		await use(dropdownContent);
	},

	notificationDialog: async ({ editMenu, enterprisePage }, use) => {
		await editMenu.getByRole("menuitem", { name: "Notification settings" }).click();
		const dialog = enterprisePage.getByRole("dialog");
		await expect(dialog).toBeVisible();

		await use(dialog);
	},

	openNotificationDialog: async ({ enterprisePage }, use) => {
		await use(async () => {
			const articleItem = enterprisePage.locator('[data-qa="catalog-navigation-article-link-level-0"]').first();
			await articleItem.hover();
			await articleItem.locator(".right-extensions button").first().click();
			const dropdownContent = enterprisePage.getByTestId("dropdown-content");
			await expect(dropdownContent).toBeVisible();
			await dropdownContent.getByRole("menuitem", { name: "Notification settings" }).click();
			const dialog = enterprisePage.getByRole("dialog");
			await expect(dialog).toBeVisible();
			return dialog;
		});
	},

	getArticleNotifications: async ({ enterprisePage }, use) => {
		await use(() =>
			enterprisePage.evaluate(async () => {
				const app = await window.app!;
				const { catalogName, itemLogicPath } = window.debug.RouterPathProvider.parsePath(
					window.location.pathname,
				);
				const catalog = await app.wm.current().getContextlessCatalog(catalogName!);
				const article = catalog.findArticle(itemLogicPath!.join("/"), []);
				return article.props.notifications ?? null;
			}),
		);
	},

	setArticleNotifications: async ({ enterprisePage }, use) => {
		await use((notifications: ArticleNotifications) =>
			enterprisePage.evaluate(async (n) => {
				const app = await window.app!;
				const { catalogName, itemLogicPath } = window.debug.RouterPathProvider.parsePath(
					window.location.pathname,
				);
				const catalog = await app.wm.current().getContextlessCatalog(catalogName!);
				const article = catalog.findArticle(itemLogicPath!.join("/"), []);
				article.props.notifications = n;
				await article.save();
			}, notifications),
		);
	},

	selectGroup: async ({ notificationDialog, enterprisePage }, use) => {
		await use(async (name: string) => {
			const groupsCombobox = notificationDialog.getByRole("combobox").first();
			await groupsCombobox.click();
			await enterprisePage.getByText(name).click();
			await enterprisePage.keyboard.press("Escape");
		});
	},

	selectUser: async ({ notificationDialog, enterprisePage }, use) => {
		await use(async (email: string) => {
			const usersCombobox = notificationDialog
				.getByRole("combobox", { name: /search users/i })
				.or(notificationDialog.getByRole("combobox").nth(1));
			await usersCombobox.click();
			await enterprisePage.waitForTimeout(300);
			const searchInput = enterprisePage.locator("[cmdk-input]");
			await expect(searchInput).toBeVisible({ timeout: 3000 });
			await searchInput.pressSequentially(email.split("@")[0]!, { delay: 100 });
			await expect(enterprisePage.getByText(email, { exact: false }).first()).toBeVisible({ timeout: 5000 });
			await enterprisePage.getByText(email, { exact: false }).first().click();
			await enterprisePage.keyboard.press("Escape");
		});
	},
});
