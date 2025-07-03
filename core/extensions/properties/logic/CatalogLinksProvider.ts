import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import FileStructure from "@core/FileStructue/FileStructure";

export type ArticlePath = string;
export type ArticleLinks = Set<Path>;
export type Backlinks = Set<Path>;

export type Link = {
	title: string;
	pathname: string;
};

export default class CatalogLinksProvider {
	private _parsedOnce = false;
	private _linksCache: Map<ArticlePath, ArticleLinks> = new Map(); // Links from the article
	private _backlinksCache: Map<ArticlePath, Backlinks> = new Map(); // Links to the article

	constructor(private _fs: FileStructure, private _catalog: Catalog) {
		this._initCatalogEvents();
	}

	get isParsed() {
		return this._parsedOnce;
	}

	public async getArticleLinks(articlePath: ArticlePath): Promise<ArticleLinks> {
		await this._parse();
		return this._linksCache.get(articlePath) || new Set<Path>();
	}

	public async getArticleBacklinks(articlePath: ArticlePath): Promise<Backlinks> {
		await this._parse();

		return this._backlinksCache.get(articlePath) || new Set<Path>();
	}

	public addArticleLink(articlePath: ArticlePath, link: Path) {
		const existingLinks = this._linksCache.get(articlePath) || new Set<Path>();
		existingLinks.add(link);
		this._linksCache.set(articlePath, existingLinks);

		const targetPath = link.value;
		const existingBacklinks = this._backlinksCache.get(targetPath) || new Set<Path>();
		existingBacklinks.add(new Path(articlePath));
		this._backlinksCache.set(targetPath, existingBacklinks);
	}

	public deleteArticleLink(articlePath: ArticlePath, link: Path) {
		const existingLinks = this._linksCache.get(articlePath);
		if (existingLinks) existingLinks.delete(link);

		const targetPath = link.value;
		const existingBacklinks = this._backlinksCache.get(targetPath);

		if (existingBacklinks) existingBacklinks.delete(new Path(articlePath));
	}

	public clearArticleLinks(articlePath: ArticlePath) {
		const links = this._linksCache.get(articlePath) || new Set<Path>();
		this._linksCache.delete(articlePath);

		for (const link of links) {
			const targetPath = link.value;
			const existingBacklinks = this._backlinksCache.get(targetPath);

			if (existingBacklinks) existingBacklinks.delete(new Path(articlePath));
		}
	}

	public async getFormattedLinks(links: Path[] | Set<Path>): Promise<Link[]> {
		const formattedLinks = [];

		for (const link of links) {
			const article = this._catalog.findItemByItemPath<Article>(link);
			if (!article) continue;
			formattedLinks.push({
				title: article.getTitle(),
				pathname: await this._catalog.getPathname(article),
			});
		}

		return formattedLinks;
	}

	private async _parseArticleLinks(article: Article) {
		const linksArray = await article.parsedContent.read(
			(p) => p?.linkManager?.resources.map((r) => p.linkManager.getAbsolutePath(r)) || [],
		);

		const links = new Set<Path>(linksArray);
		this._linksCache.set(article.ref.path.value, links);

		for (const link of links) {
			const targetPath = link.value;
			const existingBacklinks = this._backlinksCache.get(targetPath) || new Set<Path>();

			if (!existingBacklinks.has(article.ref.path)) {
				existingBacklinks.add(article.ref.path);
				this._backlinksCache.set(targetPath, existingBacklinks);
			}
		}
	}

	private async _parse() {
		if (this._parsedOnce) return;

		for (const article of this._catalog.getContentItems()) {
			this._initArticleEvents(article);
			await this._parseArticleLinks(article);
		}

		this._parsedOnce = true;
	}

	private _initArticleEvents(article: Article) {
		article.events.on("item-update-content", async (props) => {
			const item = props.item as Article;
			if (await item.parsedContent.isNull()) return;

			this.clearArticleLinks(item.ref.path.value);
			await this._parseArticleLinks(item);
		});
	}

	private _initCatalogEvents() {
		this._fs.events.on("before-item-create", ({ mutableItem }) => {
			const item = mutableItem.item as Article;
			this._initArticleEvents(item);
		});

		this._catalog.events.on("item-deleted", ({ ref }) => {
			this._linksCache.delete(ref.path.value);
			this._backlinksCache.delete(ref.path.value);
		});

		this._catalog.events.on("item-moved", ({ from, to }) => {
			if (this._linksCache.has(from.path.value)) {
				const links = this._linksCache.get(from.path.value);
				this._linksCache.delete(from.path.value);
				if (links) this._linksCache.set(to.path.value, links);
			}

			if (this._backlinksCache.has(from.path.value)) {
				const backlinks = this._backlinksCache.get(from.path.value);
				this._backlinksCache.delete(from.path.value);
				if (backlinks) this._backlinksCache.set(to.path.value, backlinks);
			}
		});
	}
}
