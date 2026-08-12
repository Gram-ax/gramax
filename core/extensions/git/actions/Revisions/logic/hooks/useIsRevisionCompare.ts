import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";

export const useIsRevisionCompare = () => {
	const catalogName = useCatalogPropsStore((state) => state?.data?.name);

	return catalogName.includes(":dif");
};
