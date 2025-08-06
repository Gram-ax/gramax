import CloudStateService from "@core-ui/ContextServices/CloudState";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";

const getCatalogUrl = () => {
	const cloudUrl = CloudStateService.value.cloudUrl;
	const catalogName = CatalogPropsService.value?.name;
	return `${cloudUrl}/${catalogName}`;
}

export default getCatalogUrl