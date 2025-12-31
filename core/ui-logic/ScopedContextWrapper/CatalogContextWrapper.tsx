import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import useGetCatalogContextData from "@core-ui/ScopedContextWrapper/useGetCatalogContextData";
import {
	CatalogStoreProvider,
	useCatalogPropsStore,
} from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";

type CatalogContextWrapperProps = {
	children: JSX.Element;
	loader?: JSX.Element;
	catalogName?: string;
	scope?: TreeReadScope;
};

const CatalogContextWrapper = (props: CatalogContextWrapperProps) => {
	const { children, loader = null, scope } = props;

	const catalogPropsStore = useCatalogPropsStore((state) => state.data);
	const catalogName = props.catalogName ?? catalogPropsStore?.name;

	const { catalogProps, apiUrlCreator, isLoading } = useGetCatalogContextData({
		catalogName,
		scope,
	});

	if (isLoading) return loader;

	return (
		<ApiUrlCreator.Provider value={apiUrlCreator}>
			<CatalogStoreProvider data={catalogProps}>
				<ResourceService.Provider>{children}</ResourceService.Provider>
			</CatalogStoreProvider>
		</ApiUrlCreator.Provider>
	);
};

export default CatalogContextWrapper;
