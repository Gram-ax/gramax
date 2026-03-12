import type { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorProvider from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import type { ArticlePreview } from "@ext/print/types";
import type { ReactNode } from "react";

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
			<ArticlePropsService.Provider value={articleProps}>
				<ResourceService.Provider>
					<>{children}</>
				</ResourceService.Provider>
			</ArticlePropsService.Provider>
		</ApiUrlCreatorProvider.Provider>
	);
};

type ArticlePrintPreviewProps = {
	item: ArticlePreview;
	// biome-ignore lint/suspicious/noExplicitAny: it's ok
	components: Record<string, (...props: any) => ReactNode>;
	onRender?: VoidFunction;
};

export const ArticlePrintPreview = ({ item, components, onRender }: ArticlePrintPreviewProps) => {
	const articleProps = { logicPath: item.logicPath, title: item.title } as ClientArticleProps;
	return (
		<ArticleServices apiUrlCreator={item.apiUrlCreator} articleProps={articleProps}>
			<h1 data-level={item.level} id={item.logicPath}>
				{item.title}
			</h1>
			{Renderer(item.content, { components }, true, onRender)}
		</ArticleServices>
	);
};
