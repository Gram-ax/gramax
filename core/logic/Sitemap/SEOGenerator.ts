import { ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import { Category } from "@core/FileStructue/Category/Category";
import { Item } from "@core/FileStructue/Item/Item";
import { Workspace } from "@ext/workspace/Workspace";

class SEOGenerator {
	constructor(private _workspace: Workspace, private _filters?: ItemFilter[]) {}

	async generateSitemapIndex(baseUrl: string) {
		const catalogEntries = this._workspace.getAllCatalogs();
		const catalogs = await Promise.all(
			[...catalogEntries.keys()].map((name) => this._workspace.getContextlessCatalog(name)),
		);
		let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n
			<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

		catalogs.forEach((catalog) => {
			if (!this._filters.every((f) => f(catalog.getRootCategory(), catalog))) return;
			sitemap += `  <sitemap>\n`;
			sitemap += `    <loc>${baseUrl}/${catalog.name}</loc>\n`;
			sitemap += `  </sitemap>\n`;
		});

		sitemap += `</sitemapindex>`;
		return sitemap;
	}

	generateRobots(sitemapUrl: string, disableSeo: boolean): string {
		return `User-agent: *\n${
			disableSeo
				? "Disallow: /*\n"
				: `Disallow: /admin/\nDisallow: /api/*\nAllow: /api/sitemap/*\n\nSitemap: ${sitemapUrl}\n`
		}`;
	}

	async generateCatalogSitemap(domain: string, catalogName: string): Promise<string> {
		let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n
		<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

		const catalog = await this._workspace.getContextlessCatalog(catalogName);
		const items = catalog.getItems();
		sitemap += await this._processItems(catalog, items, domain);

		sitemap += `</urlset>`;
		return sitemap;
	}

	private async _processItems(catalog: ReadonlyCatalog, items: Item[], domain: string) {
		let sitemap = "";
		for (const item of items) {
			if (!this._filters.every((f) => f(item, catalog))) continue;
			sitemap += `  <url>\n`;
			sitemap += `    <loc>${domain}/${await catalog.getPathname(item)}</loc>\n`;
			sitemap += `  </url>\n`;

			if (item instanceof Category && item.items) {
				sitemap += await this._processItems(catalog, item.items, domain);
			}
		}

		return sitemap;
	}
}
export default SEOGenerator;
