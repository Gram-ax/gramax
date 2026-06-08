import { FRAGMENTS_DIRECTORY, GRAMAX_DIRECTORY } from "@app/config/const";
import type Context from "@core/Context/Context";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type FileStructure from "@core/FileStructue/FileStructure";
import ArticleProvider from "@ext/articleProvider/logic/ArticleProvider";
import type { ItemID } from "@ext/articleProvider/models/types";
import type MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import type MarkdownParser from "@ext/markdown/core/Parser/Parser";
import type ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import type ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import type { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import type { JSONContent } from "@tiptap/core";

declare module "@ext/articleProvider/logic/ArticleProvider" {
	export enum ArticleProviders {
		fragment = "fragment",
	}
}

export default class FragmentProvider extends ArticleProvider {
	private _parsing = new Map<string, Promise<void>>();

	constructor(fp: FileProvider, fs: FileStructure, catalog: Catalog) {
		super(fp, fs, catalog, new Path(FRAGMENTS_DIRECTORY));
		fs.events.on("catalog-read", async () => {
			const gramaxSnippetsPath = new Path([this._catalog.basePath.value, GRAMAX_DIRECTORY, "snippets"]);
			await this.readArticles(gramaxSnippetsPath); // legacy: old OPFS storage path
			await this.readArticles();
		});
	}

	public async getArticlesWithFragment(fragmentId: string) {
		const result = [];
		for (const item of this._catalog.getContentItems()) {
			await item.parsedContent.read((p) => {
				if (p?.parsedContext.fragment.has(fragmentId)) result.push(item);
			});
		}

		return result;
	}

	public async getEditData(fragmentId: string, parser: MarkdownParser) {
		const fragment = this.getArticle(fragmentId);
		if (!fragment) return;
		if (await fragment.parsedContent.isNull())
			await fragment.parsedContent.write(() => parser.parse(fragment.content));

		return await fragment.parsedContent.read((p) => {
			return p.editTree;
		});
	}

	public async getRenderData(fragmentId: string, context: ParserContext) {
		const fragment = this.getArticle(fragmentId);
		if (!fragment) throw new Error("Fragment not found");

		if (this._parsing.has(fragmentId)) {
			await this._parsing.get(fragmentId);
		} else if (await fragment.parsedContent.isNull()) {
			let resolve: () => void;
			const promise = new Promise<void>((res) => {
				resolve = res;
			});
			this._parsing.set(fragmentId, promise);

			try {
				await fragment.parsedContent.write(() => context.parser.parse(fragment.content, context));
			} finally {
				this._parsing.delete(fragmentId);
				resolve();
			}
		}

		return await fragment.parsedContent.read((p) => {
			return {
				id: fragmentId,
				title: fragment.getTitle(),
				content: (p.renderTree as Tag).children,
				path: fragment.ref.path.value,
			};
		});
	}

	override async remove(
		id: ItemID,
		parser: MarkdownParser,
		parserContextFactory: ParserContextFactory,
		ctx: Context,
	) {
		const article = this.getArticle(id);

		const articles = await this.getArticlesWithFragment(id);
		for (const article of articles) {
			await article.parsedContent.write(() => null);
		}

		if (this._isOldFragment(article.ref.path)) {
			await this._fp.delete(article.ref.path);

			return;
		}

		await super.remove(id, parser, parserContextFactory, ctx);
	}

	public async clearArticlesContentWithFragment(fragmentId: string) {
		const articles = await this.getArticlesWithFragment(fragmentId);
		for (const article of articles) {
			await article.parsedContent.write(() => null);
		}
	}

	override async updateContent(
		id: ItemID,
		editTree: JSONContent,
		formatter: MarkdownFormatter,
		parserContextFactory: ParserContextFactory,
		parser: MarkdownParser,
		ctx: Context,
	) {
		const article = this.getArticle(id);
		if (!article) return;

		if (this._isOldFragment(article.ref.path)) {
			await this.remove(id, parser, parserContextFactory, ctx);
			await this._fp.delete(article.ref.path);

			await this.create(
				article.ref.path.name,
				editTree,
				formatter,
				parserContextFactory,
				parser,
				ctx,
				article.props,
			);

			return;
		}

		await super.updateContent(id, editTree, formatter, parserContextFactory, parser, ctx);
	}

	private _isOldFragment(path: Path) {
		return path.value.includes(`${GRAMAX_DIRECTORY}/snippets`);
	}
}
