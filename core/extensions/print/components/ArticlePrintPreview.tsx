import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ApiUrlCreatorProvider from "@core-ui/ContextServices/ApiUrlCreator";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import { ArticlePreview } from "@ext/print/types";
import { ReactNode } from "react";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";

const ArticleServices = ({
	apiUrlCreator,
	children,
	articleProps,
}: {
	apiUrlCreator: ApiUrlCreator;
	children: ReactNode;
	articleProps: ClientArticleProps;
}) => {
	return (
		<ApiUrlCreatorProvider.Provider value={apiUrlCreator}>
			<ResourceService.Provider>
				<ArticlePropsService.Provider value={articleProps}>
					<>{children}</>
				</ArticlePropsService.Provider>
			</ResourceService.Provider>
		</ApiUrlCreatorProvider.Provider>
	);
};

type ArticlePrintPreviewProps = {
	item: ArticlePreview;
	index: number;
	components: Record<string, (...props: any) => ReactNode>;
	onRender?: VoidFunction;
};

export const ArticlePrintPreview = ({ item, index, components, onRender }: ArticlePrintPreviewProps) => {
	const articleProps = { logicPath: item.logicPath, title: item.title } as ClientArticleProps;
	return (
		<ArticleServices apiUrlCreator={item.apiUrlCreator} articleProps={articleProps}>
			<h1 id={item.logicPath} style={index ? { pageBreakBefore: "always" } : {}}>
				{item.title}
			</h1>
			{Renderer(item.content, { components }, true, onRender)}
		</ArticleServices>
	);
};
