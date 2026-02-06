import type { Locator, Page as PlaywrightPage } from "@playwright/test";
import { Dropdown } from "./dropdown";

export class Select extends Dropdown {
	constructor(page: PlaywrightPage, trigger: Locator, content?: Locator) {
		super(page, trigger, content ?? page.getByTestId("select-content"), page.getByTestId("select-item"));
	}
}
