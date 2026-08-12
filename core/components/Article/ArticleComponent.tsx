import type { ArticleComponentProps } from "@components/Article/Article";
import ArticleEditRenderer from "@components/Article/ArticleEditRenderer";
import { ArticleMarkdownRenderer } from "@components/Article/ArticleMarkdownRenderer";
import { ArticleReadRenderer } from "@components/Article/ArticleReadRenderer";
import type { ArticlePageData } from "@core/SitePresenter/types/ArticlePage";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import ArticleDiffViewWrapper from "@ext/git/core/Diff/components/ArticleDiffViewWrapper";

const Components: Record<
	ArticlePageData["mode"],
	React.ComponentType<ArticleComponentProps<ArticlePageData["mode"]>>
> = {
	edit: ArticleEditRenderer,
	read: ArticleReadRenderer,
	markdown: ArticleMarkdownRenderer,
};

export const ArticleComponent = ({ data, isReadOnly }: ArticleComponentProps<ArticlePageData["mode"]>) => {
	const Component = Components[data.mode];
	if (!Component) throw new DefaultError("Invalid article mode", null, { errorCode: "invalid-article-mode" });
	// Will be deleted when diff will be implemented in ContentEditor
	if (data?.diff) {
		return <ArticleDiffViewWrapper data={data.diff} isReadOnly={isReadOnly} />;
	}

	return <Component data={data} isReadOnly={isReadOnly} />;
};
