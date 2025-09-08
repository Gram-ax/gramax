import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorProvider from "@core-ui/ContextServices/ApiUrlCreator";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import { ArticlePreview } from "@ext/print/types";
import { ReactNode } from "react";

const ArticleServices = ({ apiUrlCreator, children }: { apiUrlCreator: ApiUrlCreator; children: ReactNode }) => {
	return (
		<ApiUrlCreatorProvider.Provider value={apiUrlCreator}>
			<ResourceService.Provider>
				<>{children}</>
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
	return (
		<ArticleServices apiUrlCreator={item.apiUrlCreator}>
			<h1 style={index ? { pageBreakBefore: "always" } : {}}>{item.title}</h1>
			{Renderer(item.content, { components }, true, onRender)}
		</ArticleServices>
	);
};
