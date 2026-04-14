import { expect, test } from "@playwright/test";
import { catalogTest } from "@web/fixtures/catalog.fixture";
import { notificationsTest } from "@web/tests/features/notifications/notifications.fixture";

const START_URL = "/-/-/-/-/notifications-test/test-article";

catalogTest.use({
	startUrl: START_URL,
	files: {
		"notifications-test": {
			"doc-root.yml": "title: Notifications Test\nsyntax: xml\n",
			"test-article.md": "---\ntitle: Test Article\n---\n\nSome content here.",
		},
	},
});

test.describe("Notification Settings", () => {
	catalogTest("button is hidden without enterprise", async ({ sharedPage }) => {
		const articleItem = sharedPage.locator('[data-qa="catalog-navigation-article-link-level-0"]').first();
		await articleItem.hover();
		await articleItem.locator(".right-extensions button").first().click();
		const dropdownContent = sharedPage.getByTestId("dropdown-content");
		await expect(dropdownContent).toBeVisible();
		await expect(dropdownContent.getByRole("menuitem", { name: "Notification settings" })).toBeHidden();
	});

	notificationsTest("button appears when enterprise is configured", async ({ editMenu }) => {
		await expect(editMenu.getByRole("menuitem", { name: "Notification settings" })).toBeVisible();
	});

	notificationsTest("modal has correct default state", async ({ notificationDialog }) => {
		await expect(notificationDialog.getByRole("radio", { name: "Notify on creation", exact: true })).toBeChecked();
		await expect(notificationDialog.getByRole("radio", { name: "Do not notify" })).toBeVisible();
		await expect(notificationDialog.getByText("Groups", { exact: true }).first()).toBeVisible();
		await expect(notificationDialog.getByText("Users", { exact: true }).first()).toBeVisible();
		await expect(notificationDialog.getByRole("button", { name: "Save" })).toBeVisible();
	});

	notificationsTest("saves state to article file", async ({ notificationDialog, getArticleNotifications }) => {
		await notificationDialog.getByRole("radio", { name: "Notify on change", exact: true }).click();
		await notificationDialog.getByRole("button", { name: "Save" }).click();
		await expect(notificationDialog).toBeHidden();

		const notifications = await getArticleNotifications();
		expect(notifications).toMatchObject({ state: "on-change", groups: [], users: [] });
	});

	notificationsTest(
		"saves selected groups and users",
		async ({ notificationDialog, getArticleNotifications, selectGroup, selectUser }) => {
			await notificationDialog.getByRole("radio", { name: "Notify on creation or change" }).click();
			await selectGroup("Editors");
			await selectUser("alice@test.com");

			await notificationDialog.getByRole("button", { name: "Save" }).click();
			await expect(notificationDialog).toBeHidden();

			const notifications = await getArticleNotifications();
			expect(notifications).toMatchObject({
				state: "on-both",
				groups: ["group-editors"],
				users: ["alice@test.com"],
			});
		},
	);

	notificationsTest(
		"loads previously saved settings",
		async ({ setArticleNotifications, openNotificationDialog }) => {
			await setArticleNotifications({ state: "on-change", groups: ["group-reviewers"], users: ["bob@test.com"] });

			const dialog = await openNotificationDialog();

			await expect(dialog.getByRole("radio", { name: "Notify on change", exact: true })).toBeChecked();
			await expect(dialog.getByText("Reviewers")).toBeVisible();
			await expect(dialog.getByText("bob@test.com")).toBeVisible();
		},
	);
});
