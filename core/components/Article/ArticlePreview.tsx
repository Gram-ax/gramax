import type { RenderContent } from "@app/commands/article/features/getRenderContentByLogicPath";
import MiniArticle from "@components/Article/MiniArticle";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleTooltipService from "@core-ui/ContextServices/ArticleTooltip";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import { useEffect, useState } from "react";

export type ArticlePreviewProps = {
	logicPath: string;
	className?: string;
};

const ArticlePreview = ({ logicPath, className }: ArticlePreviewProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const pageProps = PageDataContextService.value;
	const catalogProps = CatalogPropsService.value;
	const [data, setData] = useState<RenderContent>(null);

	useEffect(() => {
		(async () => {
			if (!catalogProps.language || pageProps.language.content == catalogProps.language)
				return data && setData(null);
			const res = await FetchService.fetch<RenderContent>(
				apiUrlCreator.getArticleRenderDataByLogicPath(logicPath),
			);
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
				<OnLoadResourceService.Provider>
					<ArticleTooltipService.Provider>
						<MiniArticle title={data.title} content={data.content} />
					</ArticleTooltipService.Provider>
				</OnLoadResourceService.Provider>
			</ApiUrlCreatorService.Provider>
		</div>
	);
};

export default ArticlePreview;
