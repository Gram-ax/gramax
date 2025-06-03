import ChalkLogger from "../../../../utils/ChalkLogger";
import FetchActions from "../FetchActions";
import { NavItem, Navigation } from "./navigation";

export interface ArticleItem {
	id: number;
	name: string;
	slug: string;
	title: string;
	content: string;

	has_children: NavItem["has_children"];
	resources: Resource[];

	breadcrumbs: any;
	attributes: any;
	page_type: any;
	html: any;
	meta: any;
	toc: any;
}

export type Resource = {
	type: "file" | "image" | "diagram";
	slug: string;
	src: string;
	status: "open" | "success" | "rejected";
	content?: string;
	is_replaced: boolean;
};

export type Articles = Record<number, ArticleItem>;

export interface ArticleProps {
	order: number;
	title: string;
	markdown: string;
}

class Article {
	private _rawMode: boolean;
	constructor() {
		this._rawMode = false;
	}

	validateArticle(article: Partial<ArticleItem>) {
		const result = { isObject: false, haveMainAttr: false, correctContent: false };

		result.isObject = typeof article === "object";
		if (!result.isObject) return result;

		result.haveMainAttr = "slug" in article && "content" in article && "id" in article;
		if (!result.haveMainAttr) return result;

		result.correctContent = typeof article.content === "string";

		return result;
	}

	set setRawMode(isRaw: boolean) {
		this._rawMode = isRaw;
	}

	getArticleData(props: ArticleProps) {
		let data = "";

		data += this._getHeader(props);

		if (!this._rawMode) {
			data += "\n\n";
		}

		data += this._getMarkdown(props);

		return data;
	}

	async getArticles(navigation: Navigation) {
		const articles: Articles = {};
		const items = Object.keys(navigation);
		const total = items.length;
		let processedCount = 0;

		const writeArticleBySlug = async (slug: string, has_children: boolean) => {
			const articleItem = await FetchActions.getArticleBySlug(slug);

			articleItem.name = slug.split("/").filter(Boolean).pop() || "";
			articleItem.has_children = has_children;
			articleItem.resources = [];
			articles[articleItem.id] = articleItem;

			processedCount += 1;
			ChalkLogger.write(`\rFetched ${processedCount}/${total} articles`);
		};

		const stack = [...items].map(Number);

		while (stack.length) {
			const itemId = stack.pop();

			const item = navigation[itemId];

			try {
				await writeArticleBySlug(item.slug, item.has_children);
			} catch (e) {
				delete navigation[itemId];
				console.log(e);
			}
		}

		ChalkLogger.deletePrevLine();

		return articles;
	}

	protected _getMarkdown({ markdown }: ArticleProps) {
		return markdown;
	}

	protected _getHeader(props: ArticleProps) {
		const { title, order } = props;
		if (this._rawMode) return this._getRawHeader(title);

		return `---\ntitle: ${title}\norder: ${order || 1.01}\n---`;
	}

	protected _getRawHeader(title) {
		return "# " + title + "\n";
	}
}

export default new Article();
