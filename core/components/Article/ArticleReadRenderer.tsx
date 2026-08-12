import type { ArticleComponentProps } from "@components/Article/Article";
import { ArticleParent } from "@components/Article/ArticleRenderer";
import { highlightAllFragmentsInDocportalByUrl } from "@components/Article/SearchHandler/ArticleSearchFragmentHander";
import { useArticlePropsStore } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore.provider";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import Header from "@ext/markdown/elements/heading/render/components/Header";
import { memo, useMemo } from "react";

export const ArticleReadRenderer = memo(({ data: { content } }: ArticleComponentProps<"read">) => {
	const articleProps = useArticlePropsStore((state) => state.data);

	return (
		<ArticleParent>
			<>
				<Header className={"article-title"} dataQa={"article-title"} level={1}>
					{articleProps.title}
				</Header>
				{Renderer(
					content,
					{ components: useMemo(getComponents, []) },
					false,
					highlightAllFragmentsInDocportalByUrl,
				)}
				<ArticleMat />
			</>
		</ArticleParent>
	);
});
