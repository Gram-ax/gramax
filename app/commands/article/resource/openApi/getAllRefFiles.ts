import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import ArticleProvider, { type ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import { span } from "@ext/loggers/opentelemetry";
import { getAllRefsFromSpec } from "@ext/markdown/elements/openApi/edit/logic/getAllRefs";
import type { OpenApiRefFiles } from "@ext/markdown/elements/openApi/OpenApiRefFiles";
import * as yaml from "js-yaml";

const getAllRefFiles: Command<
	{
		src: Path;
		ctx: Context;
		refs?: string[];
		spec?: string;
		articlePath: Path;
		catalogName: string;
		providerType: ArticleProviderType;
	},
	{
		files: OpenApiRefFiles;
	}
> = Command.create({
	path: "article/resource/openApi/getAllRefFiles",

	kind: ResponseKind.json,

	async do({ src, refs, spec, catalogName, articlePath, ctx, providerType }) {
		const { parser, parserContextFactory, wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) {
			span()?.addEvent("no-catalog", { catalogName });
			return { files: {} };
		}

		const article = providerType
			? ArticleProvider.getProvider(catalog, providerType).getArticle(articlePath.value)
			: catalog.findItemByItemPath<Article>(articlePath);

		if (!article) {
			span()?.addEvent("no-article", { articlePath: articlePath.value });
			return { files: {} };
		}
		await parseContent(article, catalog, ctx, parser, parserContextFactory);

		const files = await article.parsedContent.read(async (p) => {
			const rm = p.parsedContext?.getResourceManager();
			if (!rm) return {};

			if (!refs) return await getAllRefsFromSpec(src, rm, spec);

			const files: OpenApiRefFiles = {};

			await refs.forEachAsync(async (ref) => {
				const content = await rm.getContent(new Path(ref));
				const str = content?.toString();
				if (!str) return;

				try {
					files[ref] = yaml.load(str);
				} catch (e) {
					const currentSpan = span();
					currentSpan?.addEvent("openapi-ref-parse-failed", {
						path: rm.getAbsolutePath(new Path(ref)).value,
					});
					currentSpan?.recordException(e as Error);
				}
			});
			return files;
		});

		return { files };
	},

	params(ctx, q, body) {
		const src = new Path(q.src);
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		const providerType = q.providerType as ArticleProviderType;
		const refs = Array.isArray(body?.refs) ? body.refs : undefined;
		const spec = typeof body?.spec === "string" ? body.spec : undefined;

		return { ctx, src, catalogName, articlePath, providerType, refs, spec };
	},
});

export default getAllRefFiles;
