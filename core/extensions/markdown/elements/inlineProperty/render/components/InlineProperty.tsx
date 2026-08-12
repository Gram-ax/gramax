import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import type { CatalogView } from "@ext/catalog/views/models/CatalogViews";
import t from "@ext/localization/locale/translate";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import combineProperties from "@ext/properties/logic/combineProperties";
import getDisplayValue from "@ext/properties/logic/getDisplayValue";
import { type Property, PropertyTypes } from "@ext/properties/models";

const resolveDisplayValue = (property: Property, properties: Map<string, Property>, bind: string) => {
	const isFlag = property ? property?.type === PropertyTypes.flag : properties.get(bind)?.type === PropertyTypes.flag;
	if (!property && !isFlag) return;
	return isFlag
		? t(property ? "yes" : "no")
		: getDisplayValue(property?.type, property?.value) || property?.name || bind;
};

const CatalogViewDisplayValue = ({ bind, view }: { bind: string; view: CatalogView }) => {
	const property = view?.properties.find((p) => p.id === bind);
	const { properties } = PropertyServiceProvider.value;

	const combinedProperty = combineProperties([property], properties)?.[0];

	return resolveDisplayValue(combinedProperty, properties, bind);
};

const ArticleDisplayValue = ({ bind }: { bind: string }) => {
	const { articleProperties, properties } = PropertyServiceProvider.value;
	const property = articleProperties?.find((p) => p?.id === bind);

	return resolveDisplayValue(property, properties, bind);
};

const InlineProperty = ({ bind }: { bind: string }) => {
	if (!PropertyServiceProvider?.value) return;
	const resolvedView = useCatalogPropsStore((state) => state.data?.resolvedView);

	return resolvedView ? (
		<CatalogViewDisplayValue bind={bind} view={resolvedView} />
	) : (
		<ArticleDisplayValue bind={bind} />
	);
};

export default InlineProperty;
