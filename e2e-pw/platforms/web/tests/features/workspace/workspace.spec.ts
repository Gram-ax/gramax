import { homeTest } from "@web/fixtures/home.fixture";

homeTest.use({});

homeTest.describe("Workspace", () => {
	homeTest.describe.configure({ mode: "serial" });

	let workspaceName: string;

	homeTest("Creates workspace and makes it active", async ({ homePage }) => {
		const [workspace, dropdown] = await homePage.topBar.getSwitchWorkspace();

		await homeTest.step("new workspace is created and active", async () => {
			workspaceName = "Test Space";
			await dropdown.open();
			const addItem = await dropdown.findItemByTitle("Add space");
			await addItem.click();
			const modal = homePage.modal;
			await modal.getByPlaceholder("Enter a name").fill(workspaceName);
			await modal.getByRole("button", { name: "Save" }).click();
			await homePage.waitForLoad();
			await workspace.assertCurrentWorkspace({ name: workspaceName });
			await workspace.assertWorkspaces([{ name: "Default Space", icon: "layers" }, { name: workspaceName }]);
		});
	});

	homeTest("Changes active workspace on selection", async ({ homePage }) => {
		const [workspace, dropdown] = await homePage.topBar.getSwitchWorkspace();

		await dropdown.open();
		const defaultItem = await dropdown.findItemByTitle("Default Space");
		await defaultItem.click();
		await homePage.waitForLoad();
		await workspace.assertCurrentWorkspace({ name: "Default Space" });
	});

	homeTest("Prevents creation of workspace with duplicate name", async ({ homePage }) => {
		const [, dropdown] = await homePage.topBar.getSwitchWorkspace();

		await homeTest.step("duplicate name error is shown", async () => {
			await dropdown.open();
			const addItem = await dropdown.findItemByTitle("Add space");
			await addItem.click();
			const modal = homePage.modal;
			await modal.getByPlaceholder("Enter a name").fill("Default Space");
			await modal.getByRole("button", { name: "Save" }).click();
			await modal.getByText("The name must be unique").waitFor({ state: "visible" });
			await modal.waitFor({ state: "visible" });
		});
	});

	homeTest("Deletes workspace and activates another", async ({ homePage }) => {
		const page = homePage.raw;
		const [workspace, dropdown] = await homePage.topBar.getSwitchWorkspace();

		await homeTest.step("another workspace is active after deletion", async () => {
			await dropdown.open();
			const item = await dropdown.findItemByTitle("Default Space");
			await item.hover();
			page.on("dialog", (dialog) => dialog.accept());
			await item.raw.locator.getByRole("button").click();
			const modal = homePage.modal;
			await modal.getByRole("button", { name: "Delete" }).click();
			await homePage.waitForLoad();
			await workspace.assertWorkspaces([{ name: "Test Space", icon: "layers" }]);
			await workspace.assertCurrentWorkspace({ name: "Test Space" });
		});
	});
});
