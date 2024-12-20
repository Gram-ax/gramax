import type { ReadonlyBaseCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import { Property, PropertyTypes } from "@ext/properties/models";

const getAllCatalogProperties = (catalog: ReadonlyBaseCatalog): Property[] => {
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
