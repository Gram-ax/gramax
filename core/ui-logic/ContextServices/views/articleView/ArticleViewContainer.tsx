import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";

const ArticleViewWrapper = styled.div`
	height: inherit;

	@media print {
		display: none;
	}
`;

const ArticleViewContainer = ({ data }: { data: ArticlePageData }) => {
	const ArticleView = ArticleViewService.value;
	const ArticleBottomView = ArticleViewService.getBottomView();

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
