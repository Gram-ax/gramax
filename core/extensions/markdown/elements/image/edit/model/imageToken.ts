import { INBOX_DIRECTORY, PROMPT_DIRECTORY, SNIPPETS_DIRECTORY, TEMPLATES_DIRECTORY } from "@app/config/const";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { ArticleProviders, type ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import type { ParseSpec } from "@ext/markdown/core/edit/logic/Prosemirror/from_markdown";
import type PrivateParserContext from "@ext/markdown/core/Parser/ParserContext/PrivateParserContext";
import { parse } from "@ext/markdown/elements/image/render/logic/imageTransformer";
import linkCreator from "@ext/markdown/elements/link/render/logic/linkCreator";
import { replacePathIfNeeded } from "../../../../../../../apps/gramax-cli/src/logic/NavigationUtils";

const dirs = [SNIPPETS_DIRECTORY, TEMPLATES_DIRECTORY, PROMPT_DIRECTORY, INBOX_DIRECTORY] as const;

const providerMapping: Record<(typeof dirs)[number], ArticleProviderType> = {
	[SNIPPETS_DIRECTORY]: "snippet",
	[TEMPLATES_DIRECTORY]: "template",
	[PROMPT_DIRECTORY]: "prompt",
	[INBOX_DIRECTORY]: "inbox",
};

const getProviderFromPath = (dir: (typeof dirs)[number]): ArticleProviderType | null => {
	if (!ArticleProviders) return null;
	return providerMapping[dir] || null;
};

const getIdAndProvider = (article: Article) => {
	const parent = article.parent;
	if (parent) return { id: null, provider: null };
	const id = article.ref.path.name;
	const provider = getProviderFromPath(article.ref.path.parentDirectoryPath.name as (typeof dirs)[number]);
	if (!provider) return { id: null, provider: null };
	return { id, provider };
};

export const getRenderSrc = (context: PrivateParserContext, src: string) => {
	const env = getExecutingEnvironment();
	const catalog = context.getCatalog();

	if (env === "static" || env === "cli") {
		const path = context.getResourceManager().getAbsolutePath(new Path(src)).value;
		if (env === "static") return path;
		if (env === "cli") return replacePathIfNeeded(path, catalog);
	}
	if (env !== "next") return;

	const article = context.getArticle();
	const { id, provider } = getIdAndProvider(article);
	return new ApiUrlCreator(context.getBasePath().value, catalog.name, article.ref.path.value)
		.getArticleResource(src, undefined, catalog.name, id, provider)
		.toString();
};

function imageToken(context: PrivateParserContext): ParseSpec {
	return {
		node: "image",
		getAttrs: (tok) => {
			const isExternalLink = linkCreator.isExternalLink(tok.attrs.src);
			if (!isExternalLink) context.getResourceManager().set(new Path(tok.attrs.src));

			const renderSrc = isExternalLink ? tok.attrs.src : getRenderSrc(context, tok.attrs.src);
			const { crop, objects, scale } = parse(
				tok.attrs.crop ?? "0,0,100,100",
				tok.attrs.scale ?? null,
				tok.attrs.objects ?? "[]",
				tok.attrs.width,
				tok.attrs.height,
				tok.attrs.float,
			);

			return {
				src: tok?.attrGet ? tok.attrGet("src") : tok.attrs.src,
				title: tok?.attrGet ? tok.attrGet("title") || null : tok.attrs.title,
				alt: tok.children ? tok.children[0]?.content || null : tok.attrs.alt,
				crop: crop,
				scale: scale,
				objects: objects,
				width: tok?.attrGet ? tok.attrGet("width") : tok.attrs.width,
				height: tok?.attrGet ? tok.attrGet("height") : tok.attrs.height,
				renderSrc,
			};
		},
	};
}

export default imageToken;
