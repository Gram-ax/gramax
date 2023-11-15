import { Page as CucumberPage } from "@playwright/test";
import el from "../../logic/utils/el";
import Catalog from "../../steps/catalog/catalog";

class Page {
	private readonly _catalog: Catalog;
	constructor(private _cucumberPage: CucumberPage) {
		this._catalog = new Catalog(_cucumberPage);
	}

	parseUrl(propUrl) {
		const query = this.cucumberPage.url().replace(propUrl, "");
		const isFirst = query.split("/").length - 1 > 1;
		const catalogName: string | undefined = query.split("/").shift();
		return { query, catalogName, isFirst };
	}

	get catalogs() {
		return this.body.locator(el("home-page-catalog-title"));
	}

	get catalog() {
		return this._catalog;
	}

	get homeBtn() {
		return this.body.locator(el("home-page-button"));
	}

	get cucumberPage() {
		return this._cucumberPage;
	}

	get body() {
		return this._cucumberPage.locator("body");
	}
}

export default Page;
