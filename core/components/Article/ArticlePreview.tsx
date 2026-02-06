import type { RenderContent } from "@app/commands/article/features/getRenderContentByLogicPath";
import MiniArticle from "@components/Article/MiniArticle";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleTooltipService from "@core-ui/ContextServices/ArticleTooltip";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import { useEffect, useState } from "react";

export type ArticlePreviewProps = {
	logicPath: string;
	className?: string;
};

const ArticlePreview = ({ logicPath, className }: ArticlePreviewProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const pageProps = PageDataContextService.value;
	const { language, name } = useCatalogPropsStore(
		(state) => ({ language: state.data.language, name: state.data.name }),
		"shallow",
	);
	const [data, setData] = useState<RenderContent>(null);

	useEffect(() => {
		(async () => {
			if (!language || pageProps.language.content == language) return data && setData(null);
			const res = await FetchService.fetch<RenderContent>(
				apiUrlCreator.getArticleRenderDataByLogicPath(logicPath),
			);
			if (res.ok) setData(await res.json());
		})();
	}, [pageProps.language.content, language, logicPath]);

	if (!data) return;

	const newApiUrlCreator = new ApiUrlCreator(pageProps.conf.basePath, name, data.articlePath);

	return (
		<div className={className}>
			<ApiUrlCreatorService.Provider value={newApiUrlCreator}>
				<ResourceService.Provider>
					<ArticleTooltipService.Provider>
						<MiniArticle content={data.content} title={data.title} />
					</ArticleTooltipService.Provider>
				</ResourceService.Provider>
			</ApiUrlCreatorService.Provider>
		</div>
	);
};

export default ArticlePreview;
