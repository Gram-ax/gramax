import { CATEGORY_ROOT_FILENAME, GRAMAX_DIRECTORY } from "@app/config/const";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import Path from "../../../../../../logic/FileProvider/Path/Path";
import type { Catalog } from "../../../../../../logic/FileStructue/Catalog/Catalog";
import ParserContext from "../../../../core/Parser/ParserContext/ParserContext";

interface LinkResult {
	href: string;
	hash: string;
	resourcePath: Path;
	isFile?: boolean;
}

const emptyResult = (href: string): LinkResult => ({
	href,
	resourcePath: null,
	hash: null,
});

class LinkCreator {
	isExternalLink(href: string): boolean {
		return !!(href?.match(/^#/) || href?.match(/^\w+:/) || href?.slice(1, 4) == "api");
	}

	async getLink(href: string, context: ParserContext): Promise<LinkResult> {
		if (this.isExternalLink(href) || !href) return emptyResult(href);

		const hashAndPath = this._getHash(href);
		if (!hashAndPath) return emptyResult(href);

		const [, path, hash] = hashAndPath;

		const resultByPath = await this._getLinkByPath(path, hash, context);
		if (resultByPath) return resultByPath;

		return this._buildFallbackLink(path, hash);
	}

	getLinkPath(rootPath: Path, mainPath: Path, href: string): Path {
		return rootPath.parentDirectoryPath.join(
			rootPath.parentDirectoryPath.subDirectory(rootPath).join(mainPath).join(new Path(href)),
		);
	}

	getCatalogNameFromPath(path: string, articlePath: Path, docsPath: Path): string {
		const rootPath = this._getArticleProviderRootPath(articlePath, docsPath);
		const currentArticleDir = rootPath.join(rootPath.subDirectory(articlePath.parentDirectoryPath));
		const resolvedPath = currentArticleDir.join(new Path(path));
		const catalogName = resolvedPath.rootDirectory.removeExtraSymbols.value;

		return catalogName;
	}

	private _getHash(href: string): RegExpMatchArray {
		return href.match(/^(.+?)(#.+)?$/);
	}

	private _getArticleProviderRootPath(articlePath: Path, docsPath: Path) {
		const isInDocsPath = articlePath.startsWith(docsPath);
		if (isInDocsPath) return docsPath;

		const rootDirectory = docsPath.rootDirectory;
		const gramaxPath = rootDirectory.join(new Path(GRAMAX_DIRECTORY));
		const isInGramaxPath = articlePath.startsWith(gramaxPath);

		if (!isInGramaxPath) return docsPath;
		return rootDirectory;
	}

	private async _getLinkByPath(path: string, hash: string, context: ParserContext): Promise<LinkResult> {
		const catalog = await this._getCatalogFromPath(path, context);
		if (!catalog) return null;

		const basePath = context.getBasePath().value;
		const articlePath = context.getArticle().ref.path;
		const articleExtension = articlePath.extension;
		const docsPath = catalog.getRootCategoryRef().path.parentDirectoryPath;

		const resolved = this._resolveHrefPath(path, articlePath, articleExtension, docsPath, catalog);
		if (!resolved) return null;

		const { hrefPath, relativeHrefPath, resourcePath } = resolved;
		if (hrefPath.extension && hrefPath.extension !== articleExtension) {
			return this._buildFileLink(basePath, catalog.name, articlePath, relativeHrefPath, resourcePath, hash);
		}

		return this._buildArticleLink(hrefPath, articlePath, hash, catalog);
	}

	private _resolveHrefPath(
		path: string,
		articlePath: Path,
		articleExtension: string,
		docsPath: Path,
		catalog: Catalog | ReadonlyCatalog,
	): { hrefPath: Path; relativeHrefPath: Path; resourcePath: Path } {
		const rootPath = this._getArticleProviderRootPath(articlePath, docsPath);

		const currentArticleDir = articlePath.parentDirectoryPath;
		const absoluteHrefPath = currentArticleDir.join(new Path(path));
		let hrefPath = rootPath.subDirectory(absoluteHrefPath);
		if (!hrefPath) return null;

		let relativeHrefPath = articlePath.getRelativePath(absoluteHrefPath);
		const resourcePath = new Path(path);

		if (hrefPath.extension) {
			return { hrefPath, relativeHrefPath, resourcePath };
		}

		const testHrefPath = new Path(hrefPath.value);
		testHrefPath.extension = articleExtension;

		const testAbsoluteHrefPath = new Path(absoluteHrefPath.value);
		testAbsoluteHrefPath.extension = articleExtension;

		if (catalog.findItemByItemPath(testHrefPath)) {
			hrefPath.extension = articleExtension;
			resourcePath.extension = articleExtension;
			relativeHrefPath = articlePath.getRelativePath(absoluteHrefPath);
			return { hrefPath, relativeHrefPath, resourcePath };
		}

		if (catalog.findItemByItemPath(testAbsoluteHrefPath)) {
			hrefPath = testAbsoluteHrefPath;
			resourcePath.extension = articleExtension;
			relativeHrefPath = articlePath.getRelativePath(absoluteHrefPath);
			return { hrefPath, relativeHrefPath, resourcePath };
		}

		const testIndexHrefPath = new Path(hrefPath.value).join(new Path(CATEGORY_ROOT_FILENAME));
		const testAbsoluteIndexHrefPath = new Path(absoluteHrefPath.value).join(new Path(CATEGORY_ROOT_FILENAME));

		if (catalog.findItemByItemPath(testIndexHrefPath)) {
			hrefPath = testIndexHrefPath;
			relativeHrefPath = articlePath.getRelativePath(absoluteHrefPath.join(new Path(CATEGORY_ROOT_FILENAME)));
			return { hrefPath, relativeHrefPath, resourcePath };
		}

		if (catalog.findItemByItemPath(testAbsoluteIndexHrefPath)) {
			hrefPath = testAbsoluteIndexHrefPath;
			relativeHrefPath = articlePath.getRelativePath(absoluteHrefPath.join(new Path(CATEGORY_ROOT_FILENAME)));
			return { hrefPath, relativeHrefPath, resourcePath };
		}

		if (
			path.startsWith("./") &&
			absoluteHrefPath.parentDirectoryPath.value === articlePath.parentDirectoryPath.value
		) {
			return {
				hrefPath: articlePath,
				relativeHrefPath: new Path("./").join(new Path(articlePath.nameWithExtension)),
				resourcePath: new Path("./").join(new Path(articlePath.nameWithExtension)),
			};
		}

		return null;
	}

	private async _getCatalogFromPath(path: string, context: ParserContext): Promise<Catalog | ReadonlyCatalog> {
		const currentCatalog = context.getCatalog();
		const articlePath = context.getArticle().ref.path;
		const docsPath = currentCatalog.getRootCategoryRef().path.parentDirectoryPath;
		const catalogName = this.getCatalogNameFromPath(path, articlePath, docsPath);
		if (catalogName === currentCatalog.name) return currentCatalog;

		const workspace = context.getWorkspaceManager().current();
		const baseCatalog = await workspace.getBaseCatalog(catalogName);

		if (!baseCatalog) return null;
		const catalog = await baseCatalog.upgrade("catalog", true);
		return catalog;
	}

	private _buildFileLink(
		basePath: string,
		catalogName: string,
		articlePath: Path,
		relativeHrefPath: Path,
		resourcePath: Path,
		hash: string,
	): LinkResult {
		const href = new ApiUrlCreator(basePath, catalogName, articlePath.value)
			.getArticleResource(relativeHrefPath.value)
			.toString();

		return { href, resourcePath, hash, isFile: true };
	}

	private async _buildArticleLink(
		hrefPath: Path,
		articlePath: Path,
		hash: string,
		catalog: Catalog | ReadonlyCatalog,
	): Promise<LinkResult> {
		const item = catalog.findItemByItemPath(hrefPath);
		if (!item) return null;

		const link = await catalog.getPathname(item);
		return {
			href: link || hrefPath?.stripExtension || "",
			resourcePath: articlePath.getRelativePath(item.ref.path),
			hash,
		};
	}

	private _buildFallbackLink(path: string, hash: string): LinkResult {
		const resourcePath = new Path(path);
		const href = path;
		return {
			href,
			resourcePath,
			hash,
		};
	}
}

const linkCreator = new LinkCreator();

export default linkCreator;
