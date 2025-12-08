import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import { Property, PropertyTypes } from "@ext/properties/models";
import { useCallback, useMemo, Dispatch, SetStateAction, useEffect } from "react";
import PropertyArticle from "@ext/properties/components/Helpers/PropertyArticle";
import combineProperties from "@ext/properties/logic/combineProperties";
import PropertyComponent from "@ext/properties/components/Property";
import AddProperty from "@ext/properties/components/Helpers/AddProperty";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import { deleteProperty, updateProperty } from "@ext/properties/logic/changeProperty";
import { isComplexProperty } from "@ext/templates/models/properties";
import { isMarkdownText } from "@ext/markdown/elements/pasteMarkdown/handlePasteMarkdown";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { IconButton } from "@ui-kit/Button";
import { ArticlePropertyWrapper } from "@ext/properties/components/ArticlePropertyWrapper";

interface PropertiesProps {
	properties: Property[];
	setProperties: Dispatch<SetStateAction<Property[]>>;
	hideList?: boolean;
}

const Properties = ({ properties, setProperties, hideList }: PropertiesProps) => {
	const articleProps = ArticlePropsService.value;
	const { properties: catalogProperties } = PropertyServiceProvider.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	useEffect(() => {
		if (catalogProperties?.size > 0) setProperties(combineProperties(properties, catalogProperties));
	}, [catalogProperties]);

	useEffect(() => {
		if (articleProps?.properties && catalogProperties?.size > 0)
			setProperties(combineProperties(articleProps.properties, catalogProperties));
	}, [articleProps?.properties]);

	const deleteHandler = useCallback(
		(id: string) => {
			setProperties((prevProps: Property[]) => {
				const newProps = deleteProperty(id, prevProps) as Property[];
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
		[articleProps, properties, catalogProperties],
	);

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
		[articleProps, properties, catalogProperties],
	);

	const onSubmit = useCallback(
		(id: string, value: string, isDelete?: boolean) => {
			if (isDelete) deleteHandler(id);
			else updateHandler(id, value);
		},
		[updateHandler, deleteHandler],
	);

	const filterProperties = useCallback((value: Property) => {
		return !isComplexProperty[value.type] && !isMarkdownText(value.value?.[0]);
	}, []);

	const articleRenderedProperties = useMemo(() => {
		if (hideList) return null;
		return properties?.filter(filterProperties)?.map((property) => (
			<PropertyArticle
				key={property.name}
				property={property}
				onSubmit={onSubmit}
				trigger={
					<div>
						<PropertyComponent
							key={property.name}
							type={property.type}
							icon={property.icon}
							value={property.value?.length && property.value[0].length ? property.value : property.name}
							name={property.name}
							propertyStyle={property.style}
							shouldShowValue={property.type !== PropertyTypes.flag}
						/>
					</div>
				}
			/>
		));
	}, [properties, onSubmit, hideList]);

	return (
		<div className="flex gap-2 ml-auto">
			<ArticlePropertyWrapper>{articleRenderedProperties}</ArticlePropertyWrapper>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<IconButton
						variant="text"
						size="xs"
						icon="list-plus"
						className="flex-shrink-0"
						data-qa="qa-add-property"
					/>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					<AddProperty
						canAdd
						properties={properties}
						catalogProperties={catalogProperties}
						onSubmit={updateHandler}
						setProperties={setProperties}
					/>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};

export default Properties;
