import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import styled from "@emotion/styled";
import { Property } from "@ext/properties/models";
import { useCallback, useMemo, CSSProperties, Dispatch, SetStateAction, useEffect } from "react";
import PropertyArticle from "@ext/properties/components/Helpers/PropertyArticle";
import combineProperties from "@ext/properties/logic/combineProperties";
import PropertyComponent from "@ext/properties/components/Property";
import AddProperty from "@ext/properties/components/Helpers/AddProperty";
import Chip from "@components/Atoms/Chip";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import { deleteProperty, updateProperty } from "@ext/properties/logic/changeProperty";
import { isComplexProperty } from "@ext/templates/models/properties";
import { isMarkdownText } from "@ext/markdown/elements/pasteMarkdown/handlePasteMarkdown";

interface PropertiesProps {
	properties: Property[];
	setProperties: Dispatch<SetStateAction<Property[]>>;
	hideList?: boolean;
	className?: string;
	style?: CSSProperties;
}

const Properties = ({ className, style, properties, setProperties, hideList }: PropertiesProps) => {
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
		return properties
			?.filter(filterProperties)
			?.map((property) => (
				<PropertyArticle
					key={property.name}
					property={property}
					onSubmit={onSubmit}
					trigger={
						<PropertyComponent
							key={property.name}
							type={property.type}
							icon={property.icon}
							value={property.value?.length && property.value[0].length ? property.value : property.name}
							name={property.name}
							propertyStyle={property.style}
						/>
					}
				/>
			));
	}, [properties, onSubmit, hideList]);

	return (
		<div className={className} style={style}>
			{articleRenderedProperties}
			<AddProperty
				trigger={
					<Chip icon="list-plus" chipStyle="none" dataQa="qa-add-property" style={{ height: "2.25em" }} />
				}
				canAdd
				properties={properties}
				catalogProperties={catalogProperties}
				onSubmit={updateHandler}
				setProperties={setProperties}
			/>
		</div>
	);
};

export default styled(Properties)`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5em;
	font-size: 0.7em;

	@media print {
		[data-qa="qa-add-property"] {
			display: none;
		}
	}
`;
