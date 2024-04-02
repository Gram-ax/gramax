import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import { Tag } from "../../../core/extensions/markdown/core/render/logic/Markdoc";
import { Command } from "../../types/Command";

const WordExport = import("../../../core/extensions/wordExport/WordExport");
const docx = import("docx");

const getAllAsWordDocument: Command<{ ctx: Context; catalogName: string }, Blob> = Command.create({
	path: "word/all",

	kind: ResponseKind.file,

	async do({ ctx, catalogName }) {
		const { lib, sitePresenterFactory, parserContextFactory } = this._app;

		const catalog = await lib.getCatalog(catalogName);
		const articles = catalog.getContentItems();
		await sitePresenterFactory.fromContext(ctx).parseAllItems(catalog);
		const wordExport = new (await WordExport).default(
			lib.getFileProviderByCatalog(catalog),
			parserContextFactory.fromArticle(articles[0], catalog, ctx.lang, ctx.user.isLogged),
		);

		const filteredArticles = articles.filter((a) => (a?.parsedContent?.renderTree as Tag)?.children.length);
		const document = await wordExport.getDocumentFromArticles(
			filteredArticles.map((article) => ({
				title: article.getTitle(),
				content: article.parsedContent.renderTree,
				resourceManager: article.parsedContent.resourceManager,
			})),
		);

		return await (await docx).Packer.toBlob(document);
	},

	params(ctx, q) {
		const articlePath = q.articlePath;
		const catalogName = q.catalogName;

		return { ctx, articlePath, catalogName };
	},
});

export default getAllAsWordDocument;
