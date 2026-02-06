import { expect, type Locator, type Page as PlaywrightPage } from "playwright/test";
import Button from "./atoms/button";

export default class Theme {
	static readonly SwitchButtonTestId = "switch-theme";
	static readonly AvailableThemes = ["light", "dark"] as const;

	private _lastTheme: (typeof Theme.AvailableThemes)[number] | null = null;

	constructor(private _page: PlaywrightPage) {}

	async assertHasTheme(theme: (typeof Theme.AvailableThemes)[number]) {
		expect(await this._current()).toEqual(theme);
	}

	async assertThemeChanged() {
		expect(this._lastTheme).toBeDefined();

		const lastTheme = this._lastTheme;
		const current = await this._current();
		expect(current).not.toEqual(lastTheme);
	}

	async switch(locator?: Locator): Promise<Button> {
		return new Button(this._page, (locator || this._page).getByTestId(Theme.SwitchButtonTestId));
	}

	private async _current(): Promise<(typeof Theme.AvailableThemes)[number]> {
		const theme = await this._page.locator("html").first().getAttribute("class");
		const current = theme
			?.split(" ")
			.find((className): className is (typeof Theme.AvailableThemes)[number] =>
				Theme.AvailableThemes.includes(className as (typeof Theme.AvailableThemes)[number]),
			);

		this._lastTheme = current ?? null;
		expect(current).toBeDefined();
		return current!;
	}
}
