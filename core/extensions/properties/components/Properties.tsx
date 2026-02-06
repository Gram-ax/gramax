import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import { isMarkdownText } from "@ext/markdown/elements/pasteMarkdown/handlePasteMarkdown";
import { ArticlePropertyWrapper } from "@ext/properties/components/ArticlePropertyWrapper";
import AddProperty from "@ext/properties/components/Helpers/AddProperty";
import PropertyArticle from "@ext/properties/components/Helpers/PropertyArticle";
import PropertyComponent from "@ext/properties/components/Property";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import { deleteProperty, updateProperty } from "@ext/properties/logic/changeProperty";
import combineProperties from "@ext/properties/logic/combineProperties";
import { shouldPropertyVisible } from "@ext/properties/logic/shouldPropertyVisible";
import { Property, PropertyTypes } from "@ext/properties/models";
import { isComplexProperty } from "@ext/templates/models/properties";
import { IconButton } from "@ui-kit/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo } from "react";

interface PropertiesProps {
	properties: Property[];
	hideList?: boolean;
	isReadOnly?: boolean;
	setProperties: Dispatch<SetStateAction<Property[]>>;
}

const Properties = ({ properties, setProperties, hideList, isReadOnly }: PropertiesProps) => {
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

	const filterProperties = useCallback(
		(value: Property) => {
			return (
				!isComplexProperty[value.type] &&
				!isMarkdownText(value.value?.[0]) &&
				shouldPropertyVisible(value, isReadOnly)
			);
		},
		[isReadOnly],
	);

	const articleRenderedProperties = useMemo(() => {
		if (hideList) return null;
		return properties?.filter(filterProperties)?.map((property) => {
			const button = (
				<PropertyComponent
					icon={property.icon}
					key={property.name}
					name={property.name}
					propertyStyle={property.style}
					shouldShowValue={property.type !== PropertyTypes.flag}
					type={property.type}
					value={property.value?.length && property.value[0].length ? property.value : property.name}
				/>
			);

			if (isReadOnly) return button;

			return (
				<PropertyArticle
					key={property.name}
					onSubmit={onSubmit}
					property={property}
					trigger={<div>{button}</div>}
				/>
			);
		});
	}, [properties, onSubmit, hideList]);

	return (
		<div className="flex gap-2 ml-auto">
			<ArticlePropertyWrapper>{articleRenderedProperties}</ArticlePropertyWrapper>
			{!isReadOnly && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<IconButton
							className="flex-shrink-0"
							data-qa="qa-add-property"
							icon="list-plus"
							size="xs"
							variant="text"
						/>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<AddProperty
							canAdd
							catalogProperties={catalogProperties}
							onSubmit={updateHandler}
							properties={properties}
							setProperties={setProperties}
						/>
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</div>
	);
};

export default Properties;
