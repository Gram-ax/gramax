import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";

const useHasRemoteStorage = (): boolean => {
	const sourceName = useCatalogPropsStore((state) => state.data?.sourceName);
	return !!sourceName;
};

export default useHasRemoteStorage;
