import { getExecutingEnvironment } from "@app/resolveModule/env";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import SEOGenerator from "@core/Sitemap/SEOGenerator";
import type { Workspace } from "@ext/workspace/Workspace";

const isBrowser = getExecutingEnvironment() === "browser";

const sitemapFileName = "sitemap.xml";
const robotsFileName = "robots.txt";

const generateStaticSeo = async (baseUrl: string, catalog: Catalog, workspace: Workspace) => {
	const SEOFiles: { name: string; content: string }[] = [];
	const sg = new SEOGenerator(workspace);

	const sitemap = await sg.generateCatalogSitemap(baseUrl, catalog);
	SEOFiles.push({ name: sitemapFileName, content: sitemap });

	if (!isBrowser) {
		const robots = sg.generateStaticRobots(`${baseUrl}/${sitemapFileName}`);
		SEOFiles.push({ name: robotsFileName, content: robots });
	}

	return SEOFiles;
};

export default generateStaticSeo;
