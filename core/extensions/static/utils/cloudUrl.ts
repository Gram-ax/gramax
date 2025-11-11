import CloudStateService from "@core-ui/ContextServices/CloudState";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";

const useGetCatalogCloudUrl = () => {
	const cloudUrl = CloudStateService.value.cloudUrl;
	const catalogName = useCatalogPropsStore((state) => state.data?.name);
	return `${cloudUrl}/${catalogName}`;
};

export default useGetCatalogCloudUrl;
