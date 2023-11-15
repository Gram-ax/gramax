import Context from "@core/Context/Context";
import { Packer } from "docx";
import { Tag } from "../../../core/extensions/markdown/core/render/logic/Markdoc";
import { WordExport } from "../../../core/extensions/wordExport/WordExport";
import { Command, ResponseKind } from "../../types/Command";

const getAllAsWordDocument: Command<{ ctx: Context; catalogName: string }, Blob> = Command.create({
	path: "word/all",

	kind: ResponseKind.file,

	async do({ ctx, catalogName }) {
		const { lib, sitePresenterFactory, parserContextFactory } = this._app;

		const catalog = await lib.getCatalog(catalogName);
		const articles = catalog.getContentItems();
		await sitePresenterFactory.fromContext(ctx).parseAllItems(catalog);
		const wordExport = new WordExport(
			lib.getFileProviderByCatalog(catalog),
			parserContextFactory.fromArticle(articles[0], catalog, ctx.lang, ctx.user.isLogged),
		);

		const filteredArticles = articles.filter((a) => (a?.parsedContent?.renderTree as Tag)?.children.length);
		const document = await wordExport.getDocumentFromArticles(
			filteredArticles.map((article) => ({
				title: article.props.title,
				content: article.parsedContent.renderTree,
				resourceManager: article.parsedContent.resourceManager,
			})),
		);

		return await Packer.toBlob(document);
	},

	params(ctx, q) {
		const articlePath = q.articlePath;
		const catalogName = q.catalogName;

		return { ctx, articlePath, catalogName };
	},
});

export default getAllAsWordDocument;
