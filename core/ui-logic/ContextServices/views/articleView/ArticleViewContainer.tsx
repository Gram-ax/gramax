import type { ArticlePageData } from "@core/SitePresenter/types/ArticlePage";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import { usePluginEvent } from "@plugins/api/events";
import type { ReactNode } from "react";

const ArticleViewContainer = ({ data, children }: { data: ArticlePageData; children?: ReactNode }) => {
	const ArticleView = ArticleViewService.value;
	const ArticleBottomView = ArticleViewService.getBottomView();

	usePluginEvent("article:open", { data });

	return (
		<>
			<div className="h-[inherit] print:hidden max-sm:h-fit max-sm:min-h-dvh flex flex-col">
				{children ?? <ArticleView data={data} />}
			</div>
			{ArticleBottomView && <ArticleBottomView data={data} />}
		</>
	);
};

export default ArticleViewContainer;
