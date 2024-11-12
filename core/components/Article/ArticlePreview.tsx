import MiniArticle from "@components/Article/MiniArticle";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleTooltipService from "@core-ui/ContextServices/ArticleTooltip";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import { useEffect, useState } from "react";

export type ArticlePreviewProps = {
	logicPath: string;
	className?: string;
};

const ArticlePreview = ({ logicPath, className }: ArticlePreviewProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const pageProps = PageDataContextService.value;
	const catalogProps = CatalogPropsService.value;
	const [data, setData] = useState(null);

	useEffect(() => {
		(async () => {
			if (!catalogProps.language || pageProps.language.content == catalogProps.language)
				return data && setData(null);
			const res = await FetchService.fetch(apiUrlCreator.getArticleRenderDataByLogicPath(logicPath));
			if (res.ok) setData(await res.json());
		})();
	}, [pageProps.language.content, catalogProps.language, logicPath]);

	if (!data) return;

	return (
		<div className={className}>
			<ApiUrlCreatorService.Provider
				value={
					new ApiUrlCreator(pageProps.conf.basePath, pageProps.isLogged, catalogProps.name, data.articlePath)
				}
			>
				<ArticleTooltipService.Provider>
					<MiniArticle title={data.title} content={data.content} />
				</ArticleTooltipService.Provider>
			</ApiUrlCreatorService.Provider>
		</div>
	);
};

export default styled(ArticlePreview)`
	opacity: 0.6;
	max-width: 30%;
	min-width: 30%;
	font-size: 10px;
	overflow-y: auto;
	transition: opacity 0.3s linear;

	:hover {
		opacity: 1;
	}
`;
