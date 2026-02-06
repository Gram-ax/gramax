import type { PlaywrightPage } from "@shared-pom/page";

export class CatalogPom {
	constructor(
		private _page: PlaywrightPage,
		private _name: string,
	) {}

	async props() {
		return this._page.evaluate(async (name: string) => {
			const { wm } = await window.app!;
			const catalog = await wm.current().getContextlessCatalog(name);
			return { ...catalog.props };
		}, this._name);
	}
}
