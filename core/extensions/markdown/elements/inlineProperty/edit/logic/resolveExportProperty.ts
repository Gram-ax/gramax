import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import type { PropertyScope } from "@ext/markdown/elements/inlineProperty/edit/models/inlineProperty";
import type { Property, PropertyValue } from "@ext/properties/models";

export const resolveExportScopeProperty = (
	catalog: ContextualCatalog,
	catalogProperties: Property[],
	articleProperties: PropertyValue[],
	bind: string,
): { property: Property; scope: PropertyScope } => {
	const catalogViewID = catalog?.props?.resolvedView?.id;
	const catalogProperty = catalogProperties.find((p) => p.id === bind);
	if (!catalogProperty) return;

	if (catalogViewID) {
		const resolvedView = catalog.props.resolvedView;
		const viewProperty = resolvedView?.properties.find((p) => p.id === bind);
		return {
			property: { ...catalogProperty, value: viewProperty?.value },
			scope: "catalog-view",
		};
	}

	const articleProperty = articleProperties?.find((p) => p.id === bind);
	return {
		property: { ...catalogProperty, value: articleProperty?.value },
		scope: "article",
	};
};
