import { Catalog, ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import { Category } from "@core/FileStructue/Category/Category";
import { Item } from "@core/FileStructue/Item/Item";
import { Workspace } from "@ext/workspace/Workspace";

class SEOGenerator {
	constructor(private _workspace: Workspace, private _filters?: ItemFilter[]) {}

	async generateSitemapIndex(baseUrl: string) {
		const catalogEntries = this._workspace.getCatalogEntries();
		const catalogs = await Promise.all([...catalogEntries.keys()].map((name) => this._workspace.getCatalog(name)));
		let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n
			<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

		catalogs.forEach((catalog) => {
			if (!this._filters.every((f) => f(catalog.getRootCategory(), catalog))) return;
			sitemap += `  <sitemap>\n`;
			sitemap += `    <loc>${baseUrl}/${catalog.getName()}</loc>\n`;
			sitemap += `  </sitemap>\n`;
		});

		sitemap += `</sitemapindex>`;
		return sitemap;
	}

	generateRobots(sitemapUrl: string): string {
		const robots =
			`User-agent: *\n` +
			`Disallow: /admin/\n` +
			`Disallow: /api/*\n` +
			`Allow: /api/sitemap/*\n\n` +
			`Sitemap: ${sitemapUrl}\n`;
		return robots;
	}

	async generateCatalogSitemap(domain: string, catalogName: string): Promise<string> {
		let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n
		<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

		const catalog = await this._workspace.getCatalog(catalogName);
		const items = catalog.getItems();
		sitemap += await this._processItems(catalog, items, domain);

		sitemap += `</urlset>`;
		return sitemap;
	}

	private async _processItems(catalog: Catalog, items: Item[], domain: string) {
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
