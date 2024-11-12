import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import { Property, PropertyTypes } from "@ext/properties/models";

const getAllCatalogProperties = (catalog: Catalog): Property[] => {
	return [
		{
			name: "hierarchy",
			values: ["child-to-current"],
			style: "blue",
			type: PropertyTypes.enum,
		} as Property,
		...(catalog.props?.properties ?? []),
	];
};

export default getAllCatalogProperties;
