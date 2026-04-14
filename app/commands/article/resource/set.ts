import { UNIQUE_NAME_SEPARATOR } from "@app/config/const";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import type CompressOptions from "@core/FileProvider/model/CompressOptions";
import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import HashResourceManager from "@core/Hash/HashItems/HashResourceManager";
import { uniqueName } from "@core/utils/uniqueName";
import ArticleProvider, { type ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import { feature } from "@ext/toggleFeatures/features";
import assert from "assert";
import { Command } from "../../../types/Command";

const debugGetCompressOptions = (): Record<string, CompressOptions> => {
	const opts = window.debug.compressOptions;
	if (opts)
		return {
			png: opts,
			jpg: opts,
			jpeg: opts,
			webp: opts,
		};

	return null;
};

const removeIndex = (name: string): string => {
	return name.replace(/-\d+$/, "");
};

const getUniqueName = (names: string[], baseFileName: string, extension: string): string => {
	let name = baseFileName;
	const normalizedExtension = extension ? extension.toLowerCase() : "";
	const newExtension = normalizedExtension ? `.${normalizedExtension}` : "";
	const normalizedNames = names.map((name) => name.toLowerCase());
	name = normalizedNames.includes(`./${name}${newExtension}`.toLowerCase()) ? removeIndex(name) : name;

	return uniqueName(`./${name}`, names, newExtension, UNIQUE_NAME_SEPARATOR, true);
};

const set: Command<
	{
		data: Buffer;
		src: Path;
		catalogName: string;
		articlePath: Path;
		ctx: Context;
		providerType: ArticleProviderType;
		force: boolean;
	},
	{
		path: string;
	}
> = Command.create({
	path: "article/resource/set",

	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ data, src, catalogName, articlePath, ctx, providerType, force }) {
		const { hashes, wm, parser, parserContextFactory } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		assert(catalog, `catalog not found: ${catalogName}`);

		const fp = workspace.getFileProvider();
		const itemRef = fp.getItemRef(articlePath);

		const article = providerType
			? ArticleProvider.getProvider(catalog, providerType).getArticle(articlePath.value)
			: catalog.findItemByItemPath<Article>(itemRef.path);

		assert(article, `article not found: ${articlePath}`);

		const settings = feature("compress-images") ? (debugGetCompressOptions()[src.extension] ?? null) : null;
		let outputPath =
			settings && settings.target !== src.extension ? new Path(`${src.stripExtension}.${settings.target}`) : src;

		if (!force) {
			const provider = providerType ? ArticleProvider.getProvider(catalog, providerType) : undefined;
			const parentDir = provider
				? provider.getArticle(articlePath.value).ref.path.parentDirectoryPath
				: articlePath.parentDirectoryPath;
			const items = await fp.getItems(parentDir);
			const names = items.map((i) => `./${i.name}`);

			const baseFileName = outputPath.name ?? article.getFileName();
			const extension = outputPath.extension?.toLowerCase() ?? "";
			const newName = getUniqueName(names, baseFileName, extension);
			outputPath =
				outputPath.parentDirectoryPath.value === "."
					? new Path(newName)
					: new Path([outputPath.parentDirectoryPath.value, newName]);
		}

		await parseContent(article, catalog, ctx, parser, parserContextFactory);

		await article.parsedContent.write(async (p) => {
			if (!p || !data) return;
			const hashItem = new HashResourceManager(outputPath, p.parsedContext.getResourceManager(), ctx);
			await p.parsedContext.getResourceManager().setContent(outputPath, data, settings);
			hashes.deleteHash(hashItem);
			return p;
		});

		return { path: outputPath.value };
	},

	params(ctx, q, body: Buffer) {
		const data = body;
		const src = new Path(q.src);
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		const providerType = q.providerType as ArticleProviderType;
		const force = q.force === "true";
		return { ctx, data, src, catalogName, articlePath, providerType, force };
	},
});

export default set;
