import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import useGetArticleContextData from "@core-ui/ScopedContextWrapper/useGetArticleContextData";
import {
	CatalogStoreProvider,
	useCatalogPropsStore,
} from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
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

	const catalogPropsStore = useCatalogPropsStore((state) => state.data);
	const catalogName = props.catalogName ?? catalogPropsStore?.name;

	const { articleProps, catalogProps, apiUrlCreator, isLoading } = useGetArticleContextData({
		articlePath,
		catalogName,
		scope,
	});

	if (isLoading) return loader;

	return (
		<ApiUrlCreator.Provider value={apiUrlCreator}>
			<ArticlePropsService.Provider value={articleProps}>
				<CatalogStoreProvider data={catalogProps}>
					<ResourceService.Provider>{children}</ResourceService.Provider>
				</CatalogStoreProvider>
			</ArticlePropsService.Provider>
		</ApiUrlCreator.Provider>
	);
};

export default ArticleContextWrapper;
