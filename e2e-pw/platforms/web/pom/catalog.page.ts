import { Dropdown } from "@shared-pom/dropdown";
import Page from "./base.page";

export default class CatalogPage extends Page {
	async getCatalogActions(): Promise<Dropdown> {
		const dropdown = new Dropdown(this._page, this._page.getByTestId("catalog-actions"));
		await dropdown.assertTriggerVisible();
		return dropdown;
	}
}
