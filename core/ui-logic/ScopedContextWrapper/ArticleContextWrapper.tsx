import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import useGetArticleContextData from "@core-ui/ScopedContextWrapper/useGetArticleContextData";
import { ArticlePropsStoreProvider } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore.provider";
import {
	CatalogStoreProvider,
	useCatalogPropsStore,
} from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";

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
			<ArticlePropsStoreProvider data={articleProps}>
				<CatalogStoreProvider data={catalogProps}>
					<ResourceService.Provider>{children}</ResourceService.Provider>
				</CatalogStoreProvider>
			</ArticlePropsStoreProvider>
		</ApiUrlCreator.Provider>
	);
};

export default ArticleContextWrapper;
