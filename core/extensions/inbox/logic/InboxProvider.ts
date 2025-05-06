import { INBOX_DIRECTORY } from "@app/config/const";
import FileProvider from "@core/FileProvider/model/FileProvider";
import { ArticleProps } from "@core/FileStructue/Article/Article";
import { Article } from "@core/FileStructue/Article/Article";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import MarkdownParser from "@ext/markdown/core/Parser/Parser";
import { InboxArticle, InboxProps } from "@ext/inbox/models/types";
import getArticleWithTitle from "@ext/markdown/elements/article/edit/logic/getArticleWithTitle";
import ArticleProvider from "@core/FileStructue/Article/ArticleProvider";
import FileStructure from "@core/FileStructue/FileStructure";
import ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import Context from "@core/Context/Context";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import assert from "assert";
import Path from "@core/FileProvider/Path/Path";

declare module "@core/FileStructue/Article/ArticleProvider" {
	export enum ArticleProviders {
		inbox = "inbox",
	}
}

export default class InboxProvider extends ArticleProvider {
	constructor(fp: FileProvider, fs: FileStructure, catalog: Catalog) {
		super(fp, fs, catalog, new Path(INBOX_DIRECTORY));
	}

	public async mergeArticles(
		draggedLogicPath: string,
		droppedLogicPath: string,
		parser: MarkdownParser,
		parserContextFactory: ParserContextFactory,
		ctx: Context,
	): Promise<Article<ArticleProps>> {
		const draggedArticle = this.findArticleByLogicPath(draggedLogicPath);
		const droppedArticle = this.findArticleByLogicPath(droppedLogicPath);

		assert(draggedArticle, "Dragged article not found");
		assert(droppedArticle, "Dropped article not found");

		const newContent = droppedArticle.content + "\n\n" + draggedArticle.content;

		const context = await parserContextFactory.fromArticle(
			droppedArticle,
			this._catalog,
			convertContentToUiLanguage(ctx.contentLanguage || this._catalog.props.language),
			ctx.user.isLogged,
		);

		await droppedArticle.updateContent(newContent);
		await droppedArticle.parsedContent.write(() => parser.parse(droppedArticle.content, context));
		await this.remove(draggedArticle.ref.path.name);

		return droppedArticle;
	}

	public async createInboxArticle(item: Article<InboxProps>): Promise<InboxArticle> {
		const itemRef = this._fp.getItemRef(item.ref.path);
		return {
			title: item.props.title ?? "",
			logicPath: item.logicPath,
			pathname: await this._catalog.getPathname(item),
			fileName: item.getFileName(),
			props: {
				date: item.props.date,
				author: item.props.author,
			},
			ref: {
				path: itemRef.path.value,
				storageId: itemRef.storageId,
			},
			content: getArticleWithTitle(
				item.props.title ?? "",
				(await item.parsedContent.read((p) => p.editTree)) || [],
			),
		};
	}

	public findArticleByLogicPath(logicPath: string): Article<ArticleProps> {
		return Array.from(this.articles.values()).find((article) => article.logicPath === logicPath);
	}

	public async getArticles(
		parser: MarkdownParser,
		parserContextFactory: ParserContextFactory,
		ctx: Context,
	): Promise<InboxArticle[]> {
		if (!this.articles.size) await this.readArticles();

		const notes = [];

		for (const item of Array.from(this.articles.values())) {
			const context = await parserContextFactory.fromArticle(
				item,
				this._catalog,
				convertContentToUiLanguage(ctx.contentLanguage || this._catalog.props.language),
				ctx.user.isLogged,
			);

			await item.parsedContent.write(() => parser.parse(item.content, context));
			notes.push(await this.createInboxArticle(item));
		}

		return notes;
	}
}
