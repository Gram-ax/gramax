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
	diff: ArticleDiffViewWrapper,
	markdown: ArticleMarkdownRenderer,
};

export const ArticleComponent = ({ data, isReadOnly }: ArticleComponentProps<ArticlePageData["mode"]>) => {
	const Component = Components[data.mode];
	if (!Component) throw new DefaultError("Invalid article mode", null, { errorCode: "invalid-article-mode" });
	return <Component data={data} isReadOnly={isReadOnly} key={data.articleProps.ref.path} />;
};
