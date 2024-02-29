import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import { Command, ResponseKind } from "../../types/Command";

const WordExport = import("../../../core/extensions/wordExport/WordExport");
const docx = import("docx");

const getAsWordDocument: Command<{ ctx: Context; articlePath: Path; catalogName: string }, Blob> = Command.create({
	path: "word",

	kind: ResponseKind.file,

	async do({ ctx, catalogName, articlePath }) {
		const { lib, parser, parserContextFactory } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		const article = catalog.findItemByItemPath<Article>(articlePath);

		await parseContent(article, catalog, ctx, parser, parserContextFactory);
		const parserContext = parserContextFactory.fromArticle(article, catalog, ctx.lang, ctx.user.isLogged);
		const wordExport = new (await WordExport).default(lib.getFileProviderByCatalog(catalog), parserContext);
		const document = await wordExport.getDocumentFromArticle({
			title: article.getTitle(),
			content: article.parsedContent.renderTree,
			resourceManager: article.parsedContent.resourceManager,
		});

		return await (await docx).Packer.toBlob(document);
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);

		return { ctx, articlePath, catalogName };
	},
});

export default getAsWordDocument;
