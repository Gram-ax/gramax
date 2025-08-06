import useGetArticleContextData from "@core-ui/ArticleContextWrapper/useGetArticleContextData";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";

type ArticleContextWrapperProps = {
	articlePath: string;
	children: JSX.Element;
	loader?: JSX.Element;
	catalogName?: string;
	scope?: TreeReadScope;
};

const ArticleContextWrapper = (props: ArticleContextWrapperProps) => {
	const { articlePath, children, loader = null, scope } = props;

	const catalogPropsService = CatalogPropsService.value;
	const catalogName = props.catalogName ?? catalogPropsService?.name;

	const { articleProps, catalogProps, apiUrlCreator, isLoading } = useGetArticleContextData({
		articlePath,
		catalogName,
		scope,
	});

	if (isLoading) return loader;

	return (
		<ApiUrlCreator.Provider value={apiUrlCreator}>
			<ArticlePropsService.Provider value={articleProps}>
				<CatalogPropsService.Provider value={catalogProps}>
					<ResourceService.Provider>{children}</ResourceService.Provider>
				</CatalogPropsService.Provider>
			</ArticlePropsService.Provider>
		</ApiUrlCreator.Provider>
	);
};

export default ArticleContextWrapper;
