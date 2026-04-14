import { ArticleParent } from "@components/Article/ArticleRenderer";
import { highlightFragmentInDocportalByUrl } from "@components/Article/SearchHandler/ArticleSearchFragmentHander";
import type { ReadonlyArticlePageData } from "@core/SitePresenter/SitePresenter";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import Header from "@ext/markdown/elements/heading/render/components/Header";
import { memo, useMemo } from "react";

export const ArticleReadRenderer = memo(({ data }: { data: ReadonlyArticlePageData }) => {
	const { articleProps } = data;
	return (
		<ArticleParent>
			<>
				<Header className={"article-title"} dataQa={"article-title"} level={1}>
					{articleProps.title}
				</Header>
				{!articleProps.description ? null : (
					<Header className={"article-description"} dataQa={"article-description"} level={2}>
						{articleProps.description}
					</Header>
				)}
				{Renderer(data.content, { components: useMemo(getComponents, []) }, false, () =>
					highlightFragmentInDocportalByUrl(),
				)}
				<ArticleMat />
			</>
		</ArticleParent>
	);
});
