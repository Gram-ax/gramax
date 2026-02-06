import type { Locator, Page as PlaywrightPage } from "@playwright/test";
import { expect } from "@playwright/test";
import type Button from "@shared-pom/button";
import { Dropdown } from "@shared-pom/dropdown";
import BaseSharedPage from "@shared-pom/page";
import Theme from "@shared-pom/theme";
import { WorkspacePom } from "./workspace.pom";

export default class TopMenu {
	private _locator: Locator;

	constructor(private _page: PlaywrightPage) {
		this._locator = this._page.getByTestId("top-menu");
	}

	async assertVisible(): Promise<void> {
		await expect(this._locator, "TopBar should be visible").toBeVisible({ timeout: 10000, visible: true });
	}

	async getAddCatalog(): Promise<Dropdown> {
		const dropdown = new Dropdown(this._page, this._locator.getByTestId("add-catalog"));

		await dropdown.assertTriggerVisible();
		return dropdown;
	}

	async getSwitchWorkspace(): Promise<[WorkspacePom, Dropdown]> {
		const workspace = new WorkspacePom(this._page);
		const dropdown = new Dropdown(this._page, this._locator.getByTestId(WorkspacePom.SwitchWorkspaceTriggerTestId));

		await dropdown.assertTriggerVisible();
		return [workspace, dropdown];
	}

	async getSwitchUiLanguage(): Promise<Dropdown> {
		const dropdown = new Dropdown(this._page, this._locator.getByTestId("switch-ui-language"));

		await dropdown.assertTriggerVisible();
		return dropdown;
	}

	async getSwitchTheme(): Promise<[Theme, Button]> {
		const theme = new Theme(this._page);
		const button = await theme.switch(this._locator);

		await button.assertVisible();
		return [theme, button];
	}
}

export class HomePage extends BaseSharedPage {
	get topBar() {
		return new TopMenu(this._page);
	}

	get workspace() {
		return new WorkspacePom(this._page);
	}
}
