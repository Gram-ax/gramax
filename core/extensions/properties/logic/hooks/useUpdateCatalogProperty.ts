import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import { useArticlePropsStore } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore.provider";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import getCatalogEditProps from "@ext/catalog/actions/propsEditor/logic/getCatalogEditProps";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import combineProperties from "@ext/properties/logic/combineProperties";
import type { Property } from "@ext/properties/models";
import { useCallback } from "react";

export const useUpdateCatalogProperty = ({ canAdd }: { canAdd: boolean }) => {
	const articleProps = ArticlePropsService.value;
	const catalogProps = useCatalogPropsStore((state) => state);
	const setArticleProps = useArticlePropsStore((state) => state.update);
	const apiUrlCreator = ApiUrlCreator.value;
	const {
		setArticleProperties,
		properties: catalogProperties,
		articleProperties: properties,
	} = PropertyServiceProvider.value;

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const saveCatalogProperties = useCallback(
		async (property: Property, isDelete: boolean = false, saveValue?: boolean) => {
			const newProps = getCatalogEditProps(catalogProps.data);
			const index = newProps.properties.findIndex((obj) => obj.id === property.id);

			if (index === -1) newProps.properties = [...newProps.properties, property];
			else {
				if (isDelete) {
					newProps.properties = newProps.properties.filter((_, propIndex) => propIndex !== index);
					const res = saveValue
						? null
						: await FetchService.fetch(apiUrlCreator.removePropertyFromArticles(property.id));

					if (res?.ok && canAdd) {
						const props = await res.json();
						setArticleProperties(combineProperties(props, catalogProperties));
					}
				} else {
					const deletedValues = saveValue
						? ""
						: newProps.properties?.[index]?.values
								?.filter((value) => !property.values.includes(value))
								.toString();

					newProps.properties = [...newProps.properties];
					newProps.properties[index] = {
						...property,
					};

					if (deletedValues) {
						const res = saveValue
							? null
							: await FetchService.fetch(
									apiUrlCreator.removePropertyFromArticles(property.id, deletedValues),
								);

						if (res?.ok && canAdd) {
							const props = await res.json();
							setArticleProperties(combineProperties(props, catalogProperties));
						}
					}
				}
			}

			FetchService.fetch(apiUrlCreator.updateCatalogProps(), JSON.stringify(newProps), MimeTypes.json);
			catalogProps.update({ properties: newProps.properties });
			if (saveValue) return;
			setArticleProps({ ...articleProps, properties: combineProperties(properties, catalogProperties) });
		},
		[canAdd, articleProps, catalogProps.data, apiUrlCreator, catalogProperties, setArticleProperties],
	);

	return saveCatalogProperties;
};
