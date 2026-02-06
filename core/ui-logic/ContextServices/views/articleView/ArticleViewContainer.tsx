import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { usePluginEvent } from "@plugins/api/events";

const ArticleViewWrapper = styled.div`
	height: inherit;

	${cssMedia.narrow} {
		height: fit-content;
		min-height: 100dvh;
	}

	@media print {
		display: none;
	}
`;

const ArticleViewContainer = ({ data }: { data: ArticlePageData }) => {
	const ArticleView = ArticleViewService.value;
	const ArticleBottomView = ArticleViewService.getBottomView();

	usePluginEvent("article:open", { data });

	return (
		<>
			<ArticleViewWrapper>
				<ArticleView data={data} />
			</ArticleViewWrapper>
			{ArticleBottomView && <ArticleBottomView data={data} />}
		</>
	);
};

export default ArticleViewContainer;
