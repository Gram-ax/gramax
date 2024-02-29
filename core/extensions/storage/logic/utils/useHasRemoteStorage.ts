import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";

const useHasRemoteStorage = (): boolean => {
	const catalogProps = CatalogPropsService.value;
	if (!catalogProps) return false;
	return !!catalogProps.sourceName;
};

export default useHasRemoteStorage;
