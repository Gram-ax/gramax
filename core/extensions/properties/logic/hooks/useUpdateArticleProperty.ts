import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import { deleteProperty, updateProperty } from "@ext/properties/logic/changeProperty";
import combineProperties from "@ext/properties/logic/combineProperties";
import type { Property } from "@ext/properties/models";
import { type Dispatch, type SetStateAction, useCallback, useEffect } from "react";

interface UseUpdateArticlePropertyProps {
	properties: Property[];
	setProperties: Dispatch<SetStateAction<Property[]>>;
}

export const useUpdateArticleProperty = (props: UseUpdateArticlePropertyProps) => {
	const { properties, setProperties } = props;
	const articleProps = ArticlePropsService.value;
	const { properties: catalogProperties } = PropertyServiceProvider.value;
	const apiUrlCreator = ApiUrlCreator.value;

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		if (catalogProperties?.size > 0) setProperties(combineProperties(properties, catalogProperties));
	}, [catalogProperties]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		if (articleProps?.properties && catalogProperties?.size > 0)
			setProperties(combineProperties(articleProps.properties, catalogProperties));
	}, [articleProps?.properties]);

	const updateHandler = useCallback(
		(id: string, value?: string) => {
			setProperties((prevProps: Property[]) => {
				const newProps = updateProperty(id, value, catalogProperties, prevProps);
				if (!newProps) return prevProps;

				FetchService.fetch(
					apiUrlCreator.updateItemProps(),
					JSON.stringify({
						...articleProps,
						properties: newProps,
					}),
					MimeTypes.json,
				);

				return combineProperties(newProps, catalogProperties);
			});
		},
		[articleProps, catalogProperties, apiUrlCreator, setProperties],
	);

	const onSubmit = useCallback(
		(id: string, value: string) => {
			updateHandler(id, value);
		},
		[updateHandler],
	);

	const onDelete = useCallback(
		(id: string) => {
			setProperties((prevProps: Property[]) => {
				const newProps = deleteProperty(id, prevProps) as Property[];

				FetchService.fetch(
					apiUrlCreator.updateItemProps(),
					JSON.stringify({
						...articleProps,
						properties: newProps,
					}),
					MimeTypes.json,
				);

				return combineProperties(newProps, catalogProperties);
			});
		},
		[articleProps, catalogProperties, apiUrlCreator, setProperties],
	);

	return { onSubmit, onDelete };
};
